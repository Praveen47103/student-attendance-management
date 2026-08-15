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


// If neither student nor admin is logged in
// send them back to login page

if (!savedStudent && !savedAdmin) {

    window.location.href = "index.html";

}

// If admin is logged in, redirect to admin page
if (savedAdmin && !savedStudent) {

    window.location.href = "admin-dashboard.html";

}


// Convert saved data back into object
// (only if student is logged in)

const student = savedStudent ? JSON.parse(savedStudent) : null;


// ==========================================
// STUDENT INFORMATION
// ==========================================

// Only display student info if student is logged in

if (student) {

    // Student name

    const studentNameEl = document.getElementById("studentName");
    if (studentNameEl) {
        studentNameEl.textContent = student.name;
    }


    // Roll number

    const rollNoEl = document.getElementById("rollNo");
    if (rollNoEl) {
        rollNoEl.textContent = student.rollNo;
    }


    // Top bar student name

    const topStudentNameEl = document.getElementById("topStudentName");
    if (topStudentNameEl) {
        topStudentNameEl.textContent = student.name;
    }


    // Top bar roll number

    const topStudentRollEl = document.getElementById("topStudentRoll");
    if (topStudentRollEl) {
        topStudentRollEl.textContent = student.rollNo;
    }


    // ==========================================
    // STUDENT DETAILS
    // ==========================================

    // For now these are your current student details

    const departmentEl = document.getElementById("department");
    if (departmentEl) {
        departmentEl.textContent = student.department || "CSE";
    }


    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = student.year || "4th Year";
    }


    const semesterEl = document.getElementById("semester");
    if (semesterEl) {
        semesterEl.textContent = student.semester || "7th Semester";
    }


    // ==========================================
    // ATTENDANCE DATA (DYNAMIC SYNC + FALLBACK)
    // ==========================================

    const stats = getStudentAttendanceStats(student.rollNo);

    // ==========================================
    // DISPLAY ATTENDANCE
    // ==========================================

    const overallPercentageEl = document.getElementById("overallPercentage");
    if (overallPercentageEl) {
        overallPercentageEl.textContent = stats.overall + "%";
    }

    const presentCountEl = document.getElementById("presentCount");
    if (presentCountEl) {
        presentCountEl.textContent = stats.present;
    }

    const absentCountEl = document.getElementById("absentCount");
    if (absentCountEl) {
        absentCountEl.textContent = stats.absent;
    }

    const totalClassesEl = document.getElementById("totalClasses");
    if (totalClassesEl) {
        totalClassesEl.textContent = stats.total;
    }

    // Render Subject Table
    renderSubjectTable(stats.subjects);

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
            { name: "Software Engineering", present: 16, absent: 4 }
        ]
    };

}

// ==========================================
// RENDER SUBJECT TABLE
// ==========================================

function renderSubjectTable(subjectsList) {

    const tableBody = document.getElementById("subjectTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = '';

    subjectsList.forEach(function (subject) {

        const total = subject.present + subject.absent;
        const percentage = total > 0 ? Math.round((subject.present / total) * 100) : 0;

        let percentageClass;
        if (percentage >= 75) {
            percentageClass = "percentage-good";
        } else if (percentage >= 65) {
            percentageClass = "percentage-warning";
        } else {
            percentageClass = "percentage-danger";
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${subject.name}</td>
            <td>${subject.present}</td>
            <td>${subject.absent}</td>
            <td>${total}</td>
            <td class="${percentageClass}">
                ${percentage}%
            </td>
        `;

        tableBody.appendChild(row);

    });

}


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logoutButton")
    .addEventListener("click", function () {


        // Remove student login

        localStorage.removeItem(
            "loggedInStudent"
        );


        // Remove admin login if available

        localStorage.removeItem(
            "loggedInAdmin"
        );


        // Go to login page

        window.location.href =
            "index.html";

    });


// ==========================================
// MOBILE MENU
// ==========================================

const menuButton =
    document.getElementById("menuButton");


const sidebar =
    document.getElementById("sidebar");


menuButton.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("show");

    }
);


// ==========================================
// CLOSE MOBILE MENU WHEN LINK CLICKED
// ==========================================

const navLinks =
    document.querySelectorAll(".nav-link");


navLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            sidebar.classList.remove("show");

        }
    );

});