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

const student = JSON.parse(savedStudent);


// ==========================================
// STUDENT INFORMATION
// ==========================================

// Student name

document.getElementById("studentName").textContent =
    student.name;


// Roll number

document.getElementById("rollNo").textContent =
    student.rollNo;


// Top bar student name

document.getElementById("topStudentName").textContent =
    student.name;


// Top bar roll number

document.getElementById("topStudentRoll").textContent =
    student.rollNo;


// ==========================================
// STUDENT DETAILS
// ==========================================

// For now these are your current student details

document.getElementById("department").textContent =
    student.department || "CSE";


document.getElementById("year").textContent =
    student.year || "4th Year";


document.getElementById("semester").textContent =
    student.semester || "7th Semester";


// ==========================================
// ATTENDANCE DATA (DYNAMIC SYNC + FALLBACK)
// ==========================================

const attendanceStats = getStudentAttendanceStats(student.rollNo);

// ==========================================
// DISPLAY ATTENDANCE OVERVIEW
// ==========================================

document.getElementById("overallPercentage").textContent =
    attendanceStats.overall + "%";


document.getElementById("presentCount").textContent =
    attendanceStats.present;


document.getElementById("absentCount").textContent =
    attendanceStats.absent;


document.getElementById("totalClasses").textContent =
    attendanceStats.total;


// ==========================================
// LAST UPDATED TIME
// ==========================================

const now = new Date();

const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});

const date = now.toLocaleDateString('en-US', {
    weekday: 'long'
});

document.getElementById("lastUpdated").textContent =
    date + " at " + time;


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
// SUBJECT TABLE
// ==========================================

const tableBody =
    document.getElementById("subjectTableBody");


attendanceStats.subjects.forEach(function (subject) {


    // Calculate total

    const total =
        subject.present +
        subject.absent;


    // Calculate percentage

    const percentage =
        total > 0 ? Math.round((subject.present / total) * 100) : 0;


    // Decide percentage class

    let percentageClass;


    if (percentage >= 75) {

        percentageClass =
            "percentage-good";

    } else if (percentage >= 65) {

        percentageClass =
            "percentage-warning";

    } else {

        percentageClass =
            "percentage-danger";

    }


    // Create table row

    const row =
        document.createElement("tr");


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
