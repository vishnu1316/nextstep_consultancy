const NextStepData = {
    getUniversities: function () {
        return [
            {
                id: 'oxford',
                name: 'University of Oxford',
                city: 'Oxford',
                country: 'UK',
                flag: '🇬🇧',
                ranking: '#1 UK',
                ielts: '6.5+',
                acceptanceRate: '18%',
                tuition: '£20k - £35k',
                intake: 'Sep 2026, Jan 2027',
                logo: 'https://upload.wikimedia.org/wikipedia/en/0/0d/OxfordUniversityLogo.png',
                courses: [
                    { name: 'MSc Computer Science', level: 'Postgraduate', duration: '1 year', fee: '£32,000' },
                    { name: 'MBA', level: 'Postgraduate', duration: '1 year', fee: '£38,000' },
                    { name: 'BSc Economics', level: 'Undergraduate', duration: '3 years', fee: '£28,000' }
                ]
            },
            {
                id: 'stanford',
                name: 'Stanford University',
                city: 'Stanford',
                country: 'USA',
                flag: '🇺🇸',
                ranking: '#3 US',
                ielts: '7.0+',
                acceptanceRate: '4%',
                tuition: '$55k - $75k',
                intake: 'Sep 2026',
                logo: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Stanford_University_seal_2003.svg',
                courses: [
                    { name: 'MS Data Science', level: 'Postgraduate', duration: '1.5 years', fee: '$64,000' },
                    { name: 'BSc Engineering', level: 'Undergraduate', duration: '4 years', fee: '$72,000' },
                    { name: 'MSc AI', level: 'Postgraduate', duration: '2 years', fee: '$68,000' }
                ]
            },
            {
                id: 'toronto',
                name: 'University of Toronto',
                city: 'Toronto',
                country: 'Canada',
                flag: '🇨🇦',
                ranking: '#1 Canada',
                ielts: '6.5+',
                acceptanceRate: '43%',
                tuition: 'CAD $28k - $42k',
                intake: 'Sep 2026, Jan 2027',
                logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/University_of_Toronto_coat_of_arms.svg',
                courses: [
                    { name: 'MSc Analytics', level: 'Postgraduate', duration: '1 year', fee: 'CAD $35,000' },
                    { name: 'BSc Computer Science', level: 'Undergraduate', duration: '4 years', fee: 'CAD $40,000' },
                    { name: 'MEng Management', level: 'Postgraduate', duration: '1 year', fee: 'CAD $30,000' }
                ]
            },
            {
                id: 'melbourne',
                name: 'University of Melbourne',
                city: 'Melbourne',
                country: 'Australia',
                flag: '🇦🇺',
                ranking: '#1 Australia',
                ielts: '6.5+',
                acceptanceRate: '70%',
                tuition: 'AUD $30k - $50k',
                intake: 'Feb 2027, Jul 2027',
                logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/University_of_Melbourne_logo.svg',
                courses: [
                    { name: 'Master of Data Science', level: 'Postgraduate', duration: '2 years', fee: 'AUD $46,000' },
                    { name: 'BCom Finance', level: 'Undergraduate', duration: '3 years', fee: 'AUD $38,000' },
                    { name: 'MSc Biotechnology', level: 'Postgraduate', duration: '2 years', fee: 'AUD $42,000' }
                ]
            },
            {
                id: 'tum',
                name: 'Technical University of Munich',
                city: 'Munich',
                country: 'Germany',
                flag: '🇩🇪',
                ranking: '#1 Germany',
                ielts: '6.5+',
                acceptanceRate: '28%',
                tuition: '€0 - €3k',
                intake: 'Oct 2026, Apr 2027',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Technische_Universit%C3%A4t_M%C3%BCnchen_Logo.svg',
                courses: [
                    { name: 'MSc Robotics', level: 'Postgraduate', duration: '2 years', fee: '€2,500' },
                    { name: 'BSc Mechanical', level: 'Undergraduate', duration: '3 years', fee: '€1,500' },
                    { name: 'MSc Computer Science', level: 'Postgraduate', duration: '2 years', fee: '€2,200' }
                ]
            },
            {
                id: 'trinity',
                name: 'Trinity College Dublin',
                city: 'Dublin',
                country: 'Ireland',
                flag: '🇮🇪',
                ranking: '#1 Ireland',
                ielts: '6.5+',
                acceptanceRate: '36%',
                tuition: '€14k - €22k',
                intake: 'Sep 2026, Jan 2027',
                logo: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Trinity_College_Dublin_crest.svg',
                courses: [
                    { name: 'MSc Artificial Intelligence', level: 'Postgraduate', duration: '1 year', fee: '€19,500' },
                    { name: 'BSc Computer Science', level: 'Undergraduate', duration: '4 years', fee: '€17,000' },
                    { name: 'MSc Finance', level: 'Postgraduate', duration: '1 year', fee: '€18,000' }
                ]
            }
        ];
    }
};

window.NextStepData = NextStepData;
