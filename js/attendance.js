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
// CHECK LOGIN
// ==========================================

const savedStudent = localStorage.getItem("loggedInStudent");
const savedAdmin = localStorage.getItem("loggedInAdmin");

if (!savedStudent && !savedAdmin) {
    window.location.href = "index.html";
}

if (savedAdmin && !savedStudent) {
    window.location.href = "admin-dashboard.html";
}

const student = savedStudent ? JSON.parse(savedStudent) : null;


// ==========================================
// INITIALIZE ATTENDANCE PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    if (!student) return;

    // Display student info
    setElText("studentName", student.name);
    setElText("rollNo", student.rollNo);
    setElText("topStudentName", student.name);
    setElText("topStudentRoll", student.rollNo);
    setElText("department", student.department || "CSE");
    setElText("year", student.year || "4th Year");
    setElText("semester", student.semester || "7th Semester");

    updateLastUpdatedTime();
    setupMenuAndEvents();

    // 1. Initial cached render
    const initialStats = getStudentAttendanceStats(student.rollNo);
    updateAttendanceUI(initialStats);

    // 2. Load live attendance from Supabase & subscribe to Realtime
    loadLiveAttendance();

});


// ==========================================
// LOAD LIVE ATTENDANCE (SUPABASE + REALTIME)
// ==========================================

async function loadLiveAttendance() {

    if (!window.supabaseClient || !student || !student.rollNo) return;

    try {
        let studentId = student.dbId || student.id;
        if (!studentId) {
            const { data: s } = await window.supabaseClient
                .from('students')
                .select('id')
                .eq('roll_number', student.rollNo)
                .maybeSingle();
            studentId = s?.id;
        }

        if (!studentId) return;

        async function fetchAndRender() {
            const { data: records, error } = await window.supabaseClient
                .from('attendance_records')
                .select(`
                    status,
                    attendance_sessions (
                        date,
                        subjects (
                            subject_code,
                            subject_name
                        )
                    )
                `)
                .eq('student_id', studentId);

            if (!error && Array.isArray(records) && records.length > 0) {
                let present = 0;
                let absent = 0;
                const subMap = {};

                records.forEach(r => {
                    const status = r.status || 'present';
                    const subName = r.attendance_sessions?.subjects?.subject_name || 'General';

                    if (!subMap[subName]) {
                        subMap[subName] = { name: subName, present: 0, absent: 0 };
                    }

                    if (status === 'present') {
                        present++;
                        subMap[subName].present++;
                    } else {
                        absent++;
                        subMap[subName].absent++;
                    }
                });

                const total = present + absent;
                const overall = total > 0 ? Math.round((present / total) * 100) : 0;

                const liveStats = {
                    hasRealData: true,
                    overall,
                    present,
                    absent,
                    total,
                    subjects: Object.values(subMap)
                };

                updateAttendanceUI(liveStats);
                updateLastUpdatedTime();
            }
        }

        await fetchAndRender();

        // Subscribe to Realtime updates on attendance_records for this student
        window.supabaseClient
            .channel(`attendance-page-${student.rollNo}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_records',
                    filter: `student_id=eq.${studentId}`
                },
                (payload) => {
                    console.info('[Realtime] Attendance update received:', payload);
                    fetchAndRender();
                }
            )
            .subscribe();

    } catch (err) {
        console.warn('[Attendance] Supabase live fetch error, using fallback:', err);
    }

}


// ==========================================
// UPDATE ATTENDANCE UI
// ==========================================

function updateAttendanceUI(stats) {

    setElText("overallPercentage", stats.overall + "%");
    setElText("presentCount", stats.present);
    setElText("absentCount", stats.absent);
    setElText("totalClasses", stats.total);

    renderSubjectTable(stats.subjects);

}


// ==========================================
// LAST UPDATED TIME
// ==========================================

function updateLastUpdatedTime() {

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-US', { weekday: 'long' });

    setElText("lastUpdated", `${date} at ${time}`);

}


// ==========================================
// GET STUDENT ATTENDANCE STATS FROM STORAGE
// ==========================================

function getStudentAttendanceStats(rollNo) {

    let present = 0;
    let absent = 0;
    const subjectMap = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('attendance_') && key !== 'attendance_records') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.students && data.students[rollNo]) {
                    const status = data.students[rollNo];
                    const subName = data.subjectName || data.subjectCode || 'General';

                    if (!subjectMap[subName]) {
                        subjectMap[subName] = { name: subName, present: 0, absent: 0 };
                    }

                    if (status === 'present') {
                        present++;
                        subjectMap[subName].present++;
                    } else {
                        absent++;
                        subjectMap[subName].absent++;
                    }
                }
            } catch (e) {}
        }
    }

    const total = present + absent;
    if (total > 0) {
        const overall = Math.round((present / total) * 100);
        return {
            hasRealData: true,
            overall,
            present,
            absent,
            total,
            subjects: Object.values(subjectMap)
        };
    }

    // Default sample fallback
    return {
        hasRealData: false,
        overall: 82,
        present: 82,
        absent: 18,
        total: 100,
        subjects: [
            { name: "Web Technologies", present: 18, absent: 2 },
            { name: "Computer Networks", present: 16, absent: 4 },
            { name: "Machine Learning", present: 17, absent: 3 },
            { name: "Cloud Computing", present: 15, absent: 5 },
            { name: "Software Engineering", present: 16, absent: 4 },
            { name: "Database Management", present: 18, absent: 2 },
            { name: "Operating Systems", present: 14, absent: 6 },
            { name: "Cryptography", present: 17, absent: 3 }
        ]
    };

}


// ==========================================
// SUBJECT TABLE (WITH 75% WARNING)
// ==========================================

function renderSubjectTable(subjectsList) {

    const tableBody = document.getElementById("subjectTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = '';

    subjectsList.forEach(function (subject) {

        const total = subject.present + subject.absent;
        const percentage = total > 0 ? Math.round((subject.present / total) * 100) : 0;

        let percentageClass;
        let shortageInfo = '';

        if (percentage >= 75) {
            percentageClass = "percentage-good";
        } else if (percentage >= 65) {
            percentageClass = "percentage-warning";
            const needed = Math.max(0, Math.ceil(3 * subject.absent - subject.present));
            shortageInfo = ` <span style="font-size:11px;">(Need ${needed})</span>`;
        } else {
            percentageClass = "percentage-danger";
            const needed = Math.max(0, Math.ceil(3 * subject.absent - subject.present));
            shortageInfo = ` <span style="font-size:11px;">(Shortage: Need ${needed})</span>`;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${subject.name}</td>
            <td>${subject.present}</td>
            <td>${subject.absent}</td>
            <td>${total}</td>
            <td class="${percentageClass}">
                ${percentage}%${shortageInfo}
            </td>
        `;

        tableBody.appendChild(row);

    });

}

function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
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
