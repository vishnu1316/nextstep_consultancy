/**
 * NextStep Global Educational Consultancy - REST API + Static Web Server
 * Module 7: Database & Backend APIs
 *
 * Data is stored in MySQL. Connection details come from the .env file
 * (see .env.example) - NEVER type your password directly in this file.
 *
 * Run:  npm install   then   node server.js
 */
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;
const TOKEN_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// ---------------------------------------------------------------
// DATABASE CONNECTION  (values are read from the .env file)
// ---------------------------------------------------------------
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nextstep_consultancy',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true // return DATE columns as 'YYYY-MM-DD' text
});

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
const MIME_TYPES = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.sql': 'text/plain'
};
const FLAGS = { UK: '🇬🇧', USA: '🇺🇸', Canada: '🇨🇦', Australia: '🇦🇺', Germany: '🇩🇪', Ireland: '🇮🇪' };
const CURRENCY = { UK: 'GBP', USA: 'USD', Canada: 'CAD', Australia: 'AUD', Germany: 'EUR', Ireland: 'EUR' };
const STATUSES = ['Submitted', 'Under Review', 'University Review', 'Offer Letter Issued', 'Visa Processing', 'Rejected'];
const STAGE_OF = { 'Submitted': 1, 'Under Review': 2, 'University Review': 3, 'Offer Letter Issued': 4, 'Visa Processing': 5, 'Rejected': 1 };
const MODES = ['Virtual Zoom Session', 'In-Person Office Visit'];

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
    res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
        req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(new HttpError(400, 'Invalid JSON body')); } });
    });
}

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000; // logins last 8 hours

function sign(payload) { return crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url'); }

function makeToken(user) {
    const payload = Buffer.from(JSON.stringify({
        id: user.user_id, email: user.email, role: user.role, exp: Date.now() + TOKEN_LIFETIME_MS
    })).toString('base64url');
    return payload + '.' + sign(payload);
}

// Returns the logged-in person from the "Authorization: Bearer <token>" header, or throws 401
function requireAuth(req, role) {
    const header = req.headers['authorization'] || '';
    const [payload, sig] = header.replace(/^Bearer\s+/i, '').split('.');
    if (!payload || !sig) throw new HttpError(401, 'Please log in first');
    const expected = Buffer.from(sign(payload)), given = Buffer.from(sig);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) throw new HttpError(401, 'Invalid login token. Please log in again');
    let data;
    try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch (e) { throw new HttpError(401, 'Invalid login token'); }
    if (!data.exp || data.exp < Date.now()) throw new HttpError(401, 'Your login has expired. Please log in again');
    if (role && data.role !== role) throw new HttpError(403, 'Only ' + role + 's can do this');
    return data;
}

const firstNumber = s => { const m = String(s || '').match(/[\d,]+(\.\d+)?/); return m ? parseFloat(m[0].replace(/,/g, '')) : null; };
const clean = (v, max = 150) => (v == null ? '' : String(v).trim().slice(0, max));

// ---------------------------------------------------------------
// ROW -> FRONT-END SHAPE MAPPERS (keeps the HTML pages unchanged)
// ---------------------------------------------------------------
function mapUser(r) {
    return {
        name: r.full_name, role: r.role, email: r.email, phone: r.phone || '',
        targetCountry: r.target_country || 'UK',
        degreeTarget: r.degree_target || 'Undergraduate / Postgraduate',
        gpa: r.gpa_percentage || '-',
        ielts: r.ielts_score != null ? Number(r.ielts_score) + ' Overall' : '-',
        avatar: 'images/student.png'
    };
}

async function getUniversities(country) {
    const [unis] = await pool.query('SELECT * FROM universities ORDER BY university_id');
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY course_id');
    let list = unis.map(u => ({
        id: 'u' + u.university_id, name: u.name, country: u.country, flag: FLAGS[u.country] || '🌍',
        city: u.city, ranking: u.global_rank, tuition: u.tuition_display, ielts: u.ielts_display,
        acceptanceRate: u.acceptance_rate, intake: u.intake, logo: u.logo_url,
        courses: courses.filter(c => c.university_id === u.university_id).map(c => ({
            name: c.course_name, level: c.degree_level, duration: c.duration_display, fee: c.fee_display
        }))
    }));
    if (country && country.toUpperCase() !== 'ALL') list = list.filter(u => u.country.toUpperCase() === country.toUpperCase());
    return list;
}

const APP_SQL = `
    SELECT a.application_id AS id, u.full_name AS studentName, u.email, u.phone,
           un.country, un.name AS university, c.course_name AS course, a.intake,
           a.status, a.applied_date AS appliedDate, a.current_stage AS stage
    FROM applications a
    JOIN student_profiles s ON a.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    JOIN universities un ON a.university_id = un.university_id
    JOIN courses c ON a.course_id = c.course_id`;

async function getApplications(id) {
    const [rows] = id
        ? await pool.query(APP_SQL + ' WHERE a.application_id = ?', [id])
        : await pool.query(APP_SQL + ' ORDER BY a.applied_date DESC, a.application_id DESC');
    const [docs] = await pool.query('SELECT application_id, file_name FROM application_documents ORDER BY document_id');
    return rows.map(r => ({ ...r, docsUploaded: docs.filter(d => d.application_id === r.id).map(d => d.file_name) }));
}

async function getBookings() {
    const [rows] = await pool.query(`
        SELECT b.booking_id AS id, u.full_name AS studentName, u.email, c.full_name AS counsellor,
               b.session_mode AS mode, b.appointment_date AS date, b.time_slot AS time,
               b.status, b.notes
        FROM counselling_appointments b
        JOIN student_profiles s ON b.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        JOIN counsellors c ON b.counsellor_id = c.counsellor_id
        ORDER BY b.appointment_date DESC, b.created_at DESC, b.booking_id DESC`);
    return rows.map(r => ({ ...r, status: r.status === 'Scheduled' ? 'Confirmed' : r.status }));
}

// Find (or create) the user + student profile for a person; returns student_id
async function ensureStudent(conn, { name, email, phone, country }) {
    email = clean(email).toLowerCase();
    if (!email) throw new HttpError(400, 'Email is required');
    let [[user]] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (!user) {
        const hash = await bcrypt.hash(crypto.randomBytes(12).toString('hex'), 10);
        const [r] = await conn.query('INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?,?,?,?,?)',
            [clean(name, 100) || 'Student', email, hash, 'student', clean(phone, 20)]);
        user = { user_id: r.insertId };
    }
    let [[prof]] = await conn.query('SELECT student_id FROM student_profiles WHERE user_id = ?', [user.user_id]);
    if (!prof) {
        const [r] = await conn.query('INSERT INTO student_profiles (user_id, target_country) VALUES (?,?)', [user.user_id, clean(country, 50) || null]);
        prof = { student_id: r.insertId };
    }
    return prof.student_id;
}

async function withTransaction(fn) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}

// ---------------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------------
async function handleApi(req, res, pathname, query) {
    const m = req.method;
    let match;

    // Health
    if (pathname === '/api/health' && m === 'GET') {
        let dbOk = false, dbError = null;
        try { await pool.query('SELECT 1'); dbOk = true; } catch (e) { dbError = e.message; }
        return sendJson(res, dbOk ? 200 : 503, {
            status: dbOk ? 'ONLINE' : 'DATABASE_DOWN', service: 'NextStep Global Backend API',
            database: process.env.DB_NAME || 'nextstep_consultancy', databaseConnected: dbOk, databaseError: dbError,
            uptimeSeconds: Math.floor(process.uptime()), timestamp: new Date().toISOString()
        });
    }

    // Auth: register
    if (pathname === '/api/auth/register' && m === 'POST') {
        const b = await readBody(req);
        const email = clean(b.email).toLowerCase(), name = clean(b.name, 100), password = String(b.password || '');
        if (!name || !email || password.length < 6) throw new HttpError(400, 'Name, email and a password of at least 6 characters are required');
        const user = await withTransaction(async conn => {
            const [[exists]] = await conn.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (exists) throw new HttpError(409, 'An account with this email already exists');
            const hash = await bcrypt.hash(password, 10);
            const [r] = await conn.query('INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?,?,?,?,?)',
                [name, email, hash, 'student', clean(b.phone, 20)]);
            await conn.query('INSERT INTO student_profiles (user_id, target_country) VALUES (?,?)', [r.insertId, clean(b.country, 50) || null]);
            const [[row]] = await conn.query(`SELECT u.*, s.target_country, s.degree_target, s.gpa_percentage, s.ielts_score
                FROM users u LEFT JOIN student_profiles s ON s.user_id = u.user_id WHERE u.user_id = ?`, [r.insertId]);
            return row;
        });
        return sendJson(res, 201, { success: true, message: 'Account created', token: makeToken(user), user: mapUser(user) });
    }

    // Auth: login
    if (pathname === '/api/auth/login' && m === 'POST') {
        const b = await readBody(req);
        const [[row]] = await pool.query(`SELECT u.*, s.target_country, s.degree_target, s.gpa_percentage, s.ielts_score
            FROM users u LEFT JOIN student_profiles s ON s.user_id = u.user_id WHERE u.email = ? AND u.is_active = 1`,
            [clean(b.email).toLowerCase()]);
        const ok = row && await bcrypt.compare(String(b.password || ''), row.password_hash);
        if (!ok) throw new HttpError(401, 'Invalid email or password');
        if (b.role === 'admin' && row.role !== 'admin') throw new HttpError(403, 'This account is not an administrator');
        return sendJson(res, 200, { success: true, message: 'Authentication successful', token: makeToken(row), user: mapUser(row) });
    }

    // Profile update (student dashboard)
    if (pathname === '/api/profile' && m === 'PUT') {
        const me = requireAuth(req);
        const b = await readBody(req);
        const email = me.role === 'admin' ? clean(b.email).toLowerCase() : me.email;
        await withTransaction(async conn => {
            const sid = await ensureStudent(conn, { name: b.name, email, phone: b.phone, country: b.targetCountry });
            const ielts = parseFloat(b.ielts);
            await conn.query('UPDATE users SET full_name = ?, phone = ? WHERE email = ?', [clean(b.name, 100), clean(b.phone, 20), email]);
            await conn.query('UPDATE student_profiles SET target_country = ?, degree_target = ?, gpa_percentage = ?, ielts_score = ? WHERE student_id = ?',
                [clean(b.targetCountry, 50), clean(b.degreeTarget), clean(b.gpa, 40), isNaN(ielts) || ielts > 99 ? null : ielts, sid]);
        });
        return sendJson(res, 200, { success: true, message: 'Profile saved' });
    }

    // Universities
    if (pathname === '/api/universities' && m === 'GET') {
        const list = await getUniversities(query.get('country'));
        return sendJson(res, 200, { success: true, count: list.length, universities: list });
    }
    if (pathname === '/api/universities' && m === 'POST') {
        requireAuth(req, 'admin');
        const b = await readBody(req);
        const name = clean(b.name);
        if (!name) throw new HttpError(400, 'University name is required');
        const country = clean(b.country, 50) || 'UK';
        const newId = await withTransaction(async conn => {
            const [r] = await conn.query(`INSERT INTO universities
                (name, country, city, global_rank, currency, acceptance_rate, min_ielts, logo_url, tuition_display, ielts_display, intake)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [name, country, clean(b.city, 100) || 'N/A', clean(b.ranking, 20), CURRENCY[country] || 'USD',
                 clean(b.acceptanceRate, 10) || '25%', parseFloat(b.ielts) || 6.5, clean(b.logo, 255) || 'images/logos/logo1.png',
                 clean(b.tuition, 100), clean(b.ielts, 60), clean(b.intake, 60) || 'Fall 2026']);
            for (const c of (Array.isArray(b.courses) ? b.courses : [])) {
                await conn.query(`INSERT INTO courses (university_id, course_name, degree_level, duration_months, tuition_fee, duration_display, fee_display, intake_season)
                    VALUES (?,?,?,?,?,?,?,?)`,
                    [r.insertId, clean(c.name), /under/i.test(c.level) ? 'Undergraduate' : 'Postgraduate', Math.round(parseFloat(c.duration) * 12) || 12,
                     firstNumber(c.fee) || 0, clean(c.duration, 30), clean(c.fee, 60), clean(b.intake, 60) || 'Fall 2026']);
            }
            return r.insertId;
        });
        const [created] = (await getUniversities()).filter(u => u.id === 'u' + newId);
        return sendJson(res, 201, { success: true, message: 'University added to catalog', university: created });
    }

    // Applications
    if (pathname === '/api/applications' && m === 'GET') {
        const me = requireAuth(req);
        let data = await getApplications();
        if (me.role !== 'admin') data = data.filter(a => a.email.toLowerCase() === me.email); // students see only their own

        return sendJson(res, 200, { success: true, totalApplications: data.length, data });
    }
    if (pathname === '/api/applications' && m === 'POST') {
        const me = requireAuth(req);
        const b = await readBody(req);
        if (me.role !== 'admin') b.email = me.email; // students can only apply for their own account
        const appId = await withTransaction(async conn => {
            const sid = await ensureStudent(conn, { name: b.studentName, email: b.email, phone: b.phone, country: b.country });
            // keep academic details on the student profile
            const ielts = parseFloat(b.englishScore);
            await conn.query('UPDATE student_profiles SET gpa_percentage = COALESCE(NULLIF(?, \'\'), gpa_percentage), ielts_score = COALESCE(?, ielts_score), target_country = COALESCE(NULLIF(?, \'\'), target_country) WHERE student_id = ?',
                [clean(b.gpa, 40), isNaN(ielts) || ielts > 99 ? null : ielts, clean(b.country, 50), sid]);

            const uniName = clean(b.university) || 'Top Regional Partner University';
            let [[uni]] = await conn.query('SELECT university_id FROM universities WHERE name = ?', [uniName]);
            if (!uni) {
                const country = clean(b.country, 50) || 'UK';
                const [r] = await conn.query(`INSERT INTO universities (name, country, city, currency, tuition_display, ielts_display, intake) VALUES (?,?,?,?,?,?,?)`,
                    [uniName, country, 'N/A', CURRENCY[country] || 'USD', 'On request', 'Varies', clean(b.intake, 60) || 'Fall 2026']);
                uni = { university_id: r.insertId };
            }
            const courseName = clean(b.course) || 'General Programme';
            let [[course]] = await conn.query('SELECT course_id FROM courses WHERE university_id = ? AND course_name = ?', [uni.university_id, courseName]);
            if (!course) {
                const [r] = await conn.query(`INSERT INTO courses (university_id, course_name, degree_level, duration_months, tuition_fee, duration_display, fee_display, intake_season)
                    VALUES (?,?,?,?,?,?,?,?)`,
                    [uni.university_id, courseName, /^(b\.?(sc|a|eng|tech|com)|bachelor|under)/i.test(courseName) ? 'Undergraduate' : 'Postgraduate', 12, 0, '1 Year', 'On request', clean(b.intake, 60) || 'Fall 2026']);
                course = { course_id: r.insertId };
            }

            let id = clean(b.id, 30);
            if (!/^[A-Za-z0-9-]{3,30}$/.test(id)) id = '';
            if (id) { const [[dup]] = await conn.query('SELECT 1 AS x FROM applications WHERE application_id = ?', [id]); if (dup) id = ''; }
            while (!id) {
                const cand = 'NSG-2026-' + Math.floor(1000 + Math.random() * 9000);
                const [[dup]] = await conn.query('SELECT 1 AS x FROM applications WHERE application_id = ?', [cand]);
                if (!dup) id = cand;
            }
            await conn.query(`INSERT INTO applications (application_id, student_id, university_id, course_id, status, current_stage, intake, applied_date)
                VALUES (?,?,?,?, 'Submitted', 1, ?, CURDATE())`, [id, sid, uni.university_id, course.course_id, clean(b.intake, 60) || 'Fall 2026']);
            for (const [type, file] of [['Passport', 'Passport.pdf'], ['Transcripts', 'Transcripts.pdf'], ['SOP', 'SOP.pdf']]) {
                await conn.query('INSERT INTO application_documents (application_id, document_type, file_name, file_path) VALUES (?,?,?,?)',
                    [id, type, file, 'uploads/simulated/' + file]);
            }
            return id;
        });
        const [application] = await getApplications(appId);
        return sendJson(res, 201, { success: true, message: 'Application submitted and queued for verification', application });
    }

    // Status change (admin)
    if ((match = pathname.match(/^\/api\/applications\/([^/]+)\/status$/)) && m === 'PUT') {
        requireAuth(req, 'admin');
        const b = await readBody(req);
        if (!STATUSES.includes(b.status)) throw new HttpError(400, 'Invalid status. Allowed: ' + STATUSES.join(', '));
        const stage = Number(b.stage) || STAGE_OF[b.status];
        const [r] = await pool.query('UPDATE applications SET status = ?, current_stage = ? WHERE application_id = ?', [b.status, stage, decodeURIComponent(match[1])]);
        if (!r.affectedRows) throw new HttpError(404, 'Application not found');
        return sendJson(res, 200, { success: true, message: 'Status updated', status: b.status, stage });
    }

    // Tracking
    if ((match = pathname.match(/^\/api\/applications\/([^/]+)\/track$/)) && m === 'GET') {
        const [app] = await getApplications(decodeURIComponent(match[1]));
        if (!app) throw new HttpError(404, 'Application not found');
        const titles = ['Dossier Submitted', 'Documents Verified', 'University Review', 'Offer Letter Issued', 'Visa Processing'];
        return sendJson(res, 200, {
            success: true, applicationId: app.id, applicant: app.studentName, university: app.university,
            currentStage: app.stage, status: app.status,
            timeline: titles.map((t, i) => ({ stage: i + 1, title: t, completed: app.stage >= i + 1 }))
        });
    }

    // Counsellors & bookings
    if (pathname === '/api/counsellors' && m === 'GET') {
        const [rows] = await pool.query('SELECT counsellor_id AS id, full_name AS name, specialization_region AS region, experience_years AS experience, rating FROM counsellors');
        return sendJson(res, 200, { success: true, counsellors: rows });
    }
    if (pathname === '/api/bookings' && m === 'GET') {
        const me = requireAuth(req);
        let data = await getBookings();
        if (me.role !== 'admin') {
            data = data.filter(x => x.email.toLowerCase() === me.email);
        }
        return sendJson(res, 200, { success: true, count: data.length, data });
    }
    if (pathname === '/api/counselling/book' && m === 'POST') {
        const me = requireAuth(req);
        const b = await readBody(req);
        if (me.role !== 'admin') b.email = me.email;
        const bookingId = await withTransaction(async conn => {
            const sid = await ensureStudent(conn, { name: b.studentName, email: b.email, phone: b.phone, country: b.country });
            let [[cons]] = await conn.query('SELECT counsellor_id FROM counsellors WHERE full_name = ?', [clean(b.counsellor)]);
            if (!cons) [[cons]] = await conn.query('SELECT counsellor_id FROM counsellors ORDER BY counsellor_id LIMIT 1');
            if (!cons) throw new HttpError(500, 'No counsellors found in the database');
            if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) throw new HttpError(400, 'A valid date (YYYY-MM-DD) is required');
            let id = clean(b.id, 30);
            if (!/^[A-Za-z0-9-]{3,30}$/.test(id)) id = '';
            if (id) { const [[dup]] = await conn.query('SELECT 1 AS x FROM counselling_appointments WHERE booking_id = ?', [id]); if (dup) id = ''; }
            while (!id) {
                const cand = 'CB-' + Math.floor(100 + Math.random() * 9000);
                const [[dup]] = await conn.query('SELECT 1 AS x FROM counselling_appointments WHERE booking_id = ?', [cand]);
                if (!dup) id = cand;
            }
            await conn.query(`INSERT INTO counselling_appointments (booking_id, student_id, counsellor_id, session_mode, appointment_date, time_slot, status, notes)
                VALUES (?,?,?,?,?,?, 'Scheduled', ?)`,
                [id, sid, cons.counsellor_id, MODES.includes(b.mode) ? b.mode : MODES[0], b.date, clean(b.time, 30) || '11:30 AM', clean(b.notes, 2000)]);
            return id;
        });
        const booking = (await getBookings()).find(x => x.id === bookingId);
        return sendJson(res, 201, { success: true, message: 'Counselling appointment confirmed', booking });
    }

    // Admin metrics (real numbers from MySQL)
    if (pathname === '/api/admin/metrics' && m === 'GET') {
        requireAuth(req, 'admin');
        const [[t]] = await pool.query('SELECT COUNT(*) AS total, SUM(status IN (\'Submitted\',\'Under Review\',\'University Review\')) AS pending FROM applications');
        const [[u]] = await pool.query('SELECT COUNT(*) AS total FROM universities');
        const [byCountry] = await pool.query(`SELECT un.country, COUNT(*) AS n FROM applications a JOIN universities un ON a.university_id = un.university_id GROUP BY un.country`);
        const regional = {};
        byCountry.forEach(r => { regional[r.country] = Math.round(100 * r.n / t.total) + '%'; });
        return sendJson(res, 200, { success: true, metrics: {
            totalApplications: t.total, pendingQueue: Number(t.pending || 0), partnerUniversities: u.total, regionalBreakdown: regional
        } });
    }

    // Raw schema
    if (pathname === '/api/schema' && m === 'GET') {
        const content = fs.readFileSync(path.join(BASE_DIR, 'schema.sql'), 'utf8');
        return sendJson(res, 200, { success: true, databaseEngine: 'MySQL 8.0', schemaContent: content });
    }

    throw new HttpError(404, 'API route not found');
}

// ---------------------------------------------------------------
// STATIC FILE SERVER
// ---------------------------------------------------------------
function serveStatic(req, res, pathname) {
    let rel;
    try { rel = decodeURIComponent(pathname); } catch (e) { rel = pathname; }
    const filePath = path.normalize(path.join(BASE_DIR, rel === '/' ? 'index.html' : rel));
    const relative = path.relative(BASE_DIR, filePath);
    const blocked = relative.startsWith('..') || ['server.js', 'package.json', 'package-lock.json'].includes(relative) || relative.split(path.sep).some(p => p.startsWith('.') || p === 'node_modules');
    const ext = path.extname(filePath).toLowerCase();
    if (blocked || !MIME_TYPES[ext]) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<h1>404 Not Found - NextStep Global Server</h1>'); }
    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<h1>404 Not Found - NextStep Global Server</h1>'); }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] });
        res.end(content);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
    const u = new URL(req.url, 'http://localhost');
    if (u.pathname.startsWith('/api/')) {
        try { await handleApi(req, res, u.pathname, u.searchParams); }
        catch (err) {
            const status = err.status || 500;
            if (status === 500) console.error('API error:', err.message);
            sendJson(res, status, { success: false, error: status === 500 ? 'Server/database error: ' + err.message : err.message });
        }
        return;
    }
    serveStatic(req, res, u.pathname);
});

server.listen(PORT, async () => {
    console.log('=======================================================');
    console.log('NextStep Global Consultancy Server Running!');
    console.log('URL: http://localhost:' + PORT);
    if (TOKEN_SECRET === 'change-this-secret') console.log('WARNING: set JWT_SECRET in your .env file (login tokens are not secure with the default).');
    try {
        await pool.query('SELECT 1');
        console.log('MySQL: CONNECTED to database "' + (process.env.DB_NAME || 'nextstep_consultancy') + '"');
    } catch (e) {
        console.log('MySQL: NOT CONNECTED -> ' + e.message);
        console.log('Check DB_USER / DB_PASSWORD / DB_NAME in your .env file and that MySQL is running.');
    }
    console.log('=======================================================');
});
