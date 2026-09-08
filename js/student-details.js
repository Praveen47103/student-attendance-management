// ==========================================
// APPLY DARK MODE FROM STORAGE
// ==========================================

function applyDarkModeFromStorage() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

applyDarkModeFromStorage();


// ==========================================
// DEFAULT SUBJECTS
// ==========================================

const defaultSubjects = [
    { name: "Web Technologies", code: "CS401", credits: 4 },
    { name: "Computer Networks", code: "CS402", credits: 4 },
    { name: "Machine Learning", code: "CS403", credits: 4 },
    { name: "Cloud Computing", code: "CS404", credits: 4 },
    { name: "Software Engineering", code: "CS405", credits: 4 },
    { name: "Database Management", code: "CS406", credits: 4 },
    { name: "Operating Systems", code: "CS407", credits: 4 },
    { name: "Cryptography", code: "CS408", credits: 4 }
];


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    const savedStudent = localStorage.getItem("loggedInStudent");
    const savedAdmin = localStorage.getItem("loggedInAdmin");

    if (!savedStudent && !savedAdmin) {
        window.location.href = "index.html";
        return;
    }

    if (savedAdmin && !savedStudent) {
        window.location.href = "admin-dashboard.html";
        return;
    }

    setupMenuAndEvents();
    loadStudentProfile();

});


// ==========================================
// LOAD STUDENT PROFILE (SUPABASE + FALLBACK)
// ==========================================

async function loadStudentProfile() {

    const savedStudent = localStorage.getItem("loggedInStudent");
    const student = JSON.parse(savedStudent) || {};

    // 1. Initial UI Render with cached session data
    renderProfileUI({
        name: student.name || 'Student',
        rollNo: student.rollNo || '-',
        department: student.department || 'CSE',
        year: student.year || '4th Year',
        semester: student.semester || '7th Semester',
        email: student.name ? student.name.toLowerCase().replace(/\s+/g, '.') + '@college.edu' : 'student@college.edu',
        phone: '+91 9876543210',
        dob: 'January 15, 2002',
        gender: 'Male',
        idNum: '12345678901234',
        address: '123 Main Street, City, State',
        city: 'Hyderabad',
        postal: '500001',
        institution: 'ABC Engineering College',
        cgpa: '8.2/10',
        attendance: '82%',
        admissionDate: 'August 15, 2021',
        batch: '2021-2025',
        emergencyName: 'Jane Doe',
        emergencyRelation: 'Mother',
        emergencyPhone: '+91 9876543211',
        emergencyEmail: 'jane.doe@email.com'
    });

    renderSubjects(defaultSubjects);

    // 2. Fetch live data from Supabase if client is available
    if (window.supabaseClient) {
        try {
            let studentDb = null;
            let profileDb = null;

            // Check active auth session
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user) {
                const { data: p } = await window.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                profileDb = p;
            }

            // Query students table by roll_number or profile_id
            if (student.rollNo) {
                const { data: s } = await window.supabaseClient
                    .from('students')
                    .select('*')
                    .eq('roll_number', student.rollNo)
                    .maybeSingle();
                studentDb = s;
            }

            if (studentDb || profileDb) {
                const liveData = {
                    name: profileDb?.full_name || studentDb?.name || student.name || 'Student',
                    rollNo: studentDb?.roll_number || student.rollNo || '-',
                    department: studentDb?.department || student.department || 'CSE',
                    year: studentDb?.year || student.year || '4th Year',
                    semester: studentDb?.semester || student.semester || '7th Semester',
                    email: profileDb?.email || studentDb?.email || (student.name ? student.name.toLowerCase().replace(/\s+/g, '.') + '@college.edu' : 'student@college.edu'),
                    phone: profileDb?.phone || studentDb?.phone || '+91 9876543210',
                    dob: studentDb?.date_of_birth ? formatDate(studentDb.date_of_birth) : 'January 15, 2002',
                    gender: studentDb?.gender || 'Male',
                    idNum: '12345678901234',
                    address: studentDb?.address || '123 Main Street, City, State',
                    city: studentDb?.city || 'Hyderabad',
                    postal: studentDb?.postal || '500001',
                    institution: 'ABC Engineering College',
                    cgpa: studentDb?.cgpa ? `${studentDb.cgpa}/10` : '8.2/10',
                    attendance: '82%',
                    admissionDate: studentDb?.admission_date ? formatDate(studentDb.admission_date) : 'August 15, 2021',
                    batch: studentDb?.batch || '2021-2025',
                    emergencyName: studentDb?.emergency_contact_name || 'Jane Doe',
                    emergencyRelation: studentDb?.emergency_contact_relation || 'Mother',
                    emergencyPhone: studentDb?.emergency_contact_phone || '+91 9876543211',
                    emergencyEmail: studentDb?.emergency_contact_email || 'jane.doe@email.com'
                };

                renderProfileUI(liveData);
            }

            // Fetch live subjects for student's department
            const dept = studentDb?.department || student.department || 'CSE';
            const { data: dbSubjects, error: subErr } = await window.supabaseClient
                .from('subjects')
                .select('subject_name, subject_code, credits, department')
                .eq('department', dept)
                .order('subject_code', { ascending: true });

            if (!subErr && Array.isArray(dbSubjects) && dbSubjects.length > 0) {
                renderSubjects(dbSubjects.map(s => ({
                    name: s.subject_name,
                    code: s.subject_code,
                    credits: s.credits
                })));
            }

        } catch (sbErr) {
            console.warn('[StudentDetails] Supabase live fetch error, using fallback:', sbErr);
        }
    }

}

function renderProfileUI(d) {

    // Top bar
    setElText("topStudentName", d.name);
    setElText("topStudentRoll", d.rollNo);

    // Profile Header
    setElText("profileName", d.name);
    setElText("profileRoll", "Roll Number: " + d.rollNo);
    setElText("profileDept", "Department: " + d.department);
    setElText("profileYear", d.year);
    setElText("profileSem", d.semester);

    // Personal Information
    setElText("fullName", d.name);
    setElText("rollNum", d.rollNo);
    setElText("dob", d.dob);
    setElText("gender", d.gender);
    setElText("idNum", d.idNum);

    // Contact Information
    setElText("email", d.email);
    setElText("phone", d.phone);
    setElText("address", d.address);
    setElText("city", d.city);
    setElText("postal", d.postal);

    // Academic Information
    setElText("degree", "Bachelor of Technology");
    setElText("dept", d.department || "Computer Science & Engineering");
    setElText("year", d.year);
    setElText("sem", d.semester);
    setElText("institution", d.institution);
    setElText("cgpa", d.cgpa);
    setElText("attendance", d.attendance);
    setElText("admissionDate", d.admissionDate);
    setElText("batch", d.batch);

    // Emergency Contact
    setElText("emergencyName", d.emergencyName);
    setElText("emergencyRelation", d.emergencyRelation);
    setElText("emergencyPhone", d.emergencyPhone);
    setElText("emergencyEmail", d.emergencyEmail);

}

function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}


// ==========================================
// DISPLAY SUBJECTS
// ==========================================

function renderSubjects(subjectList) {

    const subjectsGrid = document.getElementById("subjectsGrid");
    if (!subjectsGrid) return;

    subjectsGrid.innerHTML = '';

    subjectList.forEach(function (subject) {
        const subjectCard = document.createElement("div");
        subjectCard.className = "subject-card";

        subjectCard.innerHTML = `
            <div class="subject-header">
                <h4>${subject.name}</h4>
                <span class="subject-code">${subject.code}</span>
            </div>
            <div class="subject-info">
                <span class="info-badge">
                    📚 ${subject.credits} Credits
                </span>
            </div>
        `;

        subjectsGrid.appendChild(subjectCard);
    });

}


// ==========================================
// MENU AND LOGOUT EVENTS
// ==========================================

function setupMenuAndEvents() {

    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");

    if (menuButton && sidebar) {
        menuButton.addEventListener("click", function () {
            sidebar.classList.toggle("show");
        });

        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(function (link) {
            link.addEventListener("click", function () {
                sidebar.classList.remove("show");
            });
        });
    }

    const logoutBtn = document.getElementById("logoutButton");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("loggedInStudent");
            localStorage.removeItem("loggedInAdmin");
            window.location.href = "index.html";
        });
    }

}
