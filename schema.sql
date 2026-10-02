-- ==========================================================
-- NextStep Global Educational Consultancy - Database Schema
-- Module 7: Database & Backend APIs
-- MySQL 8.0 schema + seed data (generated from js/data.js)
-- Demo login for every seeded user: password123
--
-- WARNING: the next line DELETES any existing database named
-- nextstep_consultancy and recreates it.
-- ==========================================================

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS nextstep_consultancy;
CREATE DATABASE nextstep_consultancy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nextstep_consultancy;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'counsellor', 'admin') DEFAULT 'student',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    target_country VARCHAR(50),
    degree_target VARCHAR(150),
    highest_qualification VARCHAR(100),
    undergrad_college VARCHAR(150),
    gpa_percentage VARCHAR(40),
    ielts_score DECIMAL(3, 1),
    gre_toefl_score VARCHAR(30),
    passport_number VARCHAR(30),
    passport_expiry DATE,
    address_city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE universities (
    university_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    country VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    global_rank VARCHAR(20),
    tuition_min DECIMAL(10, 2),
    tuition_max DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'GBP',
    acceptance_rate VARCHAR(10),
    min_ielts DECIMAL(3, 1) DEFAULT 6.5,
    logo_url VARCHAR(255),
    tuition_display VARCHAR(100),
    ielts_display VARCHAR(60),
    intake VARCHAR(60) DEFAULT 'Fall 2026',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uni_country (country)
) ENGINE=InnoDB;

CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    university_id INT NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    degree_level ENUM('Undergraduate', 'Postgraduate', 'Doctorate') NOT NULL,
    duration_months INT NOT NULL,
    tuition_fee DECIMAL(10, 2) NOT NULL,
    duration_display VARCHAR(30),
    fee_display VARCHAR(60),
    intake_season VARCHAR(60) DEFAULT 'Fall 2026',
    CONSTRAINT fk_course_uni FOREIGN KEY (university_id) REFERENCES universities(university_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE applications (
    application_id VARCHAR(30) PRIMARY KEY,
    student_id INT NOT NULL,
    university_id INT NOT NULL,
    course_id INT NOT NULL,
    status ENUM('Submitted', 'Under Review', 'University Review', 'Offer Letter Issued', 'Visa Processing', 'Rejected') DEFAULT 'Submitted',
    current_stage TINYINT DEFAULT 1,
    intake VARCHAR(60) NOT NULL,
    applied_date DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES student_profiles(student_id),
    CONSTRAINT fk_app_uni FOREIGN KEY (university_id) REFERENCES universities(university_id),
    CONSTRAINT fk_app_course FOREIGN KEY (course_id) REFERENCES courses(course_id)
) ENGINE=InnoDB;

CREATE TABLE application_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(30) NOT NULL,
    document_type ENUM('Passport', 'Transcripts', 'IELTS_Scorecard', 'SOP', 'LOR', 'Financial_Proof') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    verification_status ENUM('Pending', 'Verified', 'Requires_Reupload') DEFAULT 'Pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_app FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE counsellors (
    counsellor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialization_region VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    rating DECIMAL(2, 1) DEFAULT 4.9,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20)
) ENGINE=InnoDB;

CREATE TABLE counselling_appointments (
    booking_id VARCHAR(30) PRIMARY KEY,
    student_id INT NOT NULL,
    counsellor_id INT NOT NULL,
    session_mode ENUM('Virtual Zoom Session', 'In-Person Office Visit') DEFAULT 'Virtual Zoom Session',
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_student FOREIGN KEY (student_id) REFERENCES student_profiles(student_id),
    CONSTRAINT fk_book_counsellor FOREIGN KEY (counsellor_id) REFERENCES counsellors(counsellor_id)
) ENGINE=InnoDB;

-- ==========================================================
-- SEED DATA
-- ==========================================================

INSERT INTO users (user_id, full_name, email, password_hash, role, phone) VALUES
(1, 'M. Reddy Vishnu Vardhan', 'vishnu@nextstepglobal.in', '$2b$10$rZrdJOLw5asj5Yy4GOUghOQpooXkJj6T51EDv5UoOkD3gNQJAAHuW', 'student', '+91 88974 53569'),
(2, 'Ananya Sharma', 'ananya.s@gmail.com', '$2b$10$rZrdJOLw5asj5Yy4GOUghOQpooXkJj6T51EDv5UoOkD3gNQJAAHuW', 'student', '+91 98450 12345'),
(3, 'Rahul Varma', 'rahul.v@yahoo.com', '$2b$10$rZrdJOLw5asj5Yy4GOUghOQpooXkJj6T51EDv5UoOkD3gNQJAAHuW', 'student', '+91 77123 98765'),
(4, 'Sneha Patel', 'sneha.p@gmail.com', '$2b$10$rZrdJOLw5asj5Yy4GOUghOQpooXkJj6T51EDv5UoOkD3gNQJAAHuW', 'student', '+91 94401 67890'),
(5, 'Somu', 'admin@nextstepglobal.in', '$2b$10$rZrdJOLw5asj5Yy4GOUghOQpooXkJj6T51EDv5UoOkD3gNQJAAHuW', 'admin', '+91 94401 11223');

INSERT INTO student_profiles (student_id, user_id, target_country, degree_target, highest_qualification, undergrad_college, gpa_percentage, ielts_score, passport_number) VALUES
(1, 1, 'UK', 'MSc Computer Science', 'B.Tech', 'SV University, Tirupati', '8.8 / 10 CGPA', 7.5, 'Z6849201'),
(2, 2, 'USA', 'MS Data Science', 'B.Tech', 'JNTU', '8.5 / 10 CGPA', 8, 'M4920183'),
(3, 3, 'Canada', 'BEng Software Engineering', 'B.Tech', NULL, NULL, NULL, NULL),
(4, 4, 'Germany', 'MSc Artificial Intelligence', 'B.Tech', NULL, NULL, NULL, NULL);

INSERT INTO universities (university_id, name, country, city, global_rank, tuition_min, tuition_max, currency, acceptance_rate, min_ielts, logo_url, tuition_display, ielts_display, intake) VALUES
(1, 'University of Oxford', 'UK', 'Oxford', '#1 Global', 28000, 39000, 'GBP', '17%', 7, 'images/logos/logo1.png', '£28,000 - £39,000/yr', '7.0 minimum', 'Fall 2026'),
(2, 'Harvard University', 'USA', 'Cambridge, MA', '#4 Global', 54000, 68000, 'USD', '4%', 7.5, 'images/logos/logo2.png', '$54,000 - $68,000/yr', '7.5 (or TOEFL 100)', 'Fall 2026'),
(3, 'University of Toronto', 'Canada', 'Toronto', '#21 Global', 42000, 58000, 'CAD', '43%', 6.5, 'images/logos/logo3.png', 'CAD $42,000 - $58,000/yr', '6.5 minimum', 'Fall 2026 / Spring 2027'),
(4, 'University of Melbourne', 'Australia', 'Melbourne', '#13 Global', 38000, 48000, 'AUD', '70%', 6.5, 'images/logos/logo4.png', 'AUD $38,000 - $48,000/yr', '6.5 minimum', 'July 2026 / Feb 2027'),
(5, 'Technical University of Munich', 'Germany', 'Munich', '#28 Global', 150, 150, 'EUR', '8%', 6.5, 'images/logos/logo5.png', '€150/semester (Near Zero Tuition)', '6.5 minimum', 'Winter 2026'),
(6, 'Trinity College Dublin', 'Ireland', 'Dublin', '#81 Global', 19000, 26000, 'EUR', '33%', 6.5, 'images/logos/logo1.png', '€19,000 - €26,000/yr', '6.5 minimum', 'Sept 2026');

INSERT INTO courses (course_id, university_id, course_name, degree_level, duration_months, tuition_fee, duration_display, fee_display, intake_season) VALUES
(1, 1, 'MSc Computer Science', 'Postgraduate', 12, 36000, '1 Year', '£36,000', 'Fall 2026'),
(2, 1, 'MBA Business Administration', 'Postgraduate', 12, 42000, '1 Year', '£42,000', 'Fall 2026'),
(3, 1, 'BSc Biomedical Engineering', 'Undergraduate', 36, 32000, '3 Years', '£32,000', 'Fall 2026'),
(4, 2, 'MS Data Science', 'Postgraduate', 24, 58000, '2 Years', '$58,000', 'Fall 2026'),
(5, 2, 'Master of Public Health', 'Postgraduate', 24, 52000, '2 Years', '$52,000', 'Fall 2026'),
(6, 2, 'BA Economics', 'Undergraduate', 48, 55000, '4 Years', '$55,000', 'Fall 2026'),
(7, 3, 'Master of Information', 'Postgraduate', 24, 45000, '2 Years', 'CAD $45,000', 'Fall 2026 / Spring 2027'),
(8, 3, 'BEng Software Engineering', 'Undergraduate', 48, 54000, '4 Years', 'CAD $54,000', 'Fall 2026 / Spring 2027'),
(9, 3, 'MBA Global Management', 'Postgraduate', 24, 50000, '2 Years', 'CAD $50,000', 'Fall 2026 / Spring 2027'),
(10, 4, 'Master of Information Technology', 'Postgraduate', 24, 46000, '2 Years', 'AUD $46,000', 'July 2026 / Feb 2027'),
(11, 4, 'Bachelor of Commerce', 'Undergraduate', 36, 42000, '3 Years', 'AUD $42,000', 'July 2026 / Feb 2027'),
(12, 4, 'Master of Cyber Security', 'Postgraduate', 18, 44000, '1.5 Years', 'AUD $44,000', 'July 2026 / Feb 2027'),
(13, 5, 'MSc Automotive & Mechanical Eng', 'Postgraduate', 24, 150, '2 Years', '€150 admin fee', 'Winter 2026'),
(14, 5, 'MSc Artificial Intelligence', 'Postgraduate', 24, 150, '2 Years', '€150 admin fee', 'Winter 2026'),
(15, 5, 'BSc Informatics', 'Undergraduate', 36, 150, '3 Years', '€150 admin fee', 'Winter 2026'),
(16, 6, 'MSc Pharmaceutical Sciences', 'Postgraduate', 12, 22000, '1 Year', '€22,000', 'Sept 2026'),
(17, 6, 'MSc Business Analytics', 'Postgraduate', 12, 24000, '1 Year', '€24,000', 'Sept 2026'),
(18, 6, 'BA Computer Science', 'Undergraduate', 48, 21000, '4 Years', '€21,000', 'Sept 2026');

INSERT INTO counsellors (counsellor_id, full_name, specialization_region, experience_years, rating, email, phone) VALUES
(1, 'Dr. Ramesh Sharma', 'UK & European Universities', 12, 4.9, 'dr.ramesh.sharma@nextstepglobal.in', '+91 88974 53570'),
(2, 'Sarah Jenkins', 'USA & Canada', 9, 4.8, 'sarah.jenkins@nextstepglobal.in', '+91 88974 53571'),
(3, 'Karthik Subramanian', 'Australia & New Zealand', 7, 4.9, 'karthik.subramanian@nextstepglobal.in', '+91 88974 53572');

INSERT INTO applications (application_id, student_id, university_id, course_id, status, current_stage, intake, applied_date) VALUES
('NSG-2026-8941', 1, 1, 1, 'Offer Letter Issued', 4, 'Fall 2026', '2026-03-01'),
('NSG-2026-8942', 2, 2, 4, 'Under Review', 2, 'Fall 2026', '2026-03-05'),
('NSG-2026-8943', 3, 3, 8, 'Submitted', 1, 'Fall 2026', '2026-03-12'),
('NSG-2026-8944', 4, 5, 14, 'Visa Processing', 5, 'Winter 2026', '2026-02-18');

INSERT INTO application_documents (application_id, document_type, file_name, file_path, verification_status) VALUES
('NSG-2026-8941', 'Passport', 'Passport.pdf', 'uploads/simulated/Passport.pdf', 'Verified'),
('NSG-2026-8941', 'Transcripts', 'Transcripts.pdf', 'uploads/simulated/Transcripts.pdf', 'Verified'),
('NSG-2026-8941', 'SOP', 'SOP.pdf', 'uploads/simulated/SOP.pdf', 'Verified'),
('NSG-2026-8942', 'Passport', 'Passport.pdf', 'uploads/simulated/Passport.pdf', 'Verified'),
('NSG-2026-8942', 'Transcripts', 'Transcripts.pdf', 'uploads/simulated/Transcripts.pdf', 'Verified'),
('NSG-2026-8942', 'SOP', 'SOP.pdf', 'uploads/simulated/SOP.pdf', 'Verified'),
('NSG-2026-8943', 'Passport', 'Passport.pdf', 'uploads/simulated/Passport.pdf', 'Verified'),
('NSG-2026-8943', 'Transcripts', 'Transcripts.pdf', 'uploads/simulated/Transcripts.pdf', 'Verified'),
('NSG-2026-8943', 'SOP', 'SOP.pdf', 'uploads/simulated/SOP.pdf', 'Verified'),
('NSG-2026-8944', 'Passport', 'Passport.pdf', 'uploads/simulated/Passport.pdf', 'Verified'),
('NSG-2026-8944', 'Transcripts', 'Transcripts.pdf', 'uploads/simulated/Transcripts.pdf', 'Verified'),
('NSG-2026-8944', 'SOP', 'SOP.pdf', 'uploads/simulated/SOP.pdf', 'Verified');

INSERT INTO counselling_appointments (booking_id, student_id, counsellor_id, session_mode, appointment_date, time_slot, status, notes) VALUES
('CB-701', 1, 1, 'Virtual Zoom Session', '2026-03-25', '11:30 AM', 'Scheduled', 'Discussion on Oxford Statement of Purpose and scholarship grants.');
