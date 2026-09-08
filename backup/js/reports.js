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
// YEARLY & SUBJECT ATTENDANCE DATA (DYNAMIC)
// ==========================================

const reportData = getStudentReportData(student.rollNo);
const yearlyData = reportData.yearlyData;
const subjects = reportData.subjects;

function getStudentReportData(rollNo) {

    let totalAttended = 0;
    let totalAbsent = 0;
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
                        subjectMap[subName] = { name: subName, total: 0, attended: 0, absent: 0 };
                    }

                    subjectMap[subName].total++;
                    if (status === 'present') {
                        totalAttended++;
                        subjectMap[subName].attended++;
                    } else {
                        totalAbsent++;
                        subjectMap[subName].absent++;
                    }
                }
            } catch (e) {}
        }
    }

    const totalHeld = totalAttended + totalAbsent;
    if (totalHeld > 0) {
        const overallAttendance = Math.round((totalAttended / totalHeld) * 100);
        return {
            yearlyData: {
                overallAttendance,
                totalClassesHeld: totalHeld,
                classesAttended: totalAttended,
                classesAbsent: totalAbsent
            },
            subjects: Object.values(subjectMap)
        };
    }

    // Default sample fallback
    return {
        yearlyData: {
            overallAttendance: 82,
            totalClassesHeld: 320,
            classesAttended: 263,
            classesAbsent: 57
        },
        subjects: [
            { name: "Web Technologies", total: 40, attended: 38, absent: 2 },
            { name: "Computer Networks", total: 40, attended: 34, absent: 6 },
            { name: "Machine Learning", total: 40, attended: 36, absent: 4 },
            { name: "Cloud Computing", total: 40, attended: 32, absent: 8 },
            { name: "Software Engineering", total: 40, attended: 35, absent: 5 },
            { name: "Database Management", total: 40, attended: 30, absent: 10 },
            { name: "Operating Systems", total: 40, attended: 28, absent: 12 },
            { name: "Cryptography", total: 40, attended: 30, absent: 10 }
        ]
    };

}


// ==========================================
// DISPLAY YEARLY STATISTICS
// ==========================================

document.getElementById("ytdAttendance").textContent =
    yearlyData.overallAttendance + "%";

document.getElementById("totalHeld").textContent =
    yearlyData.totalClassesHeld;

document.getElementById("totalAttended").textContent =
    yearlyData.classesAttended;

document.getElementById("totalAbsent").textContent =
    yearlyData.classesAbsent;


// ==========================================
// GENERATE SUBJECT REPORT TABLE
// ==========================================

const reportTableBody =
    document.getElementById("reportTableBody");


let excellentCount = 0;
let goodCount = 0;
let averageCount = 0;
let poorCount = 0;


subjects.forEach(function (subject) {


    // Calculate percentage

    const percentage = Math.round(
        (subject.attended / subject.total) * 100
    );


    // Decide status

    let statusClass;
    let statusText;


    if (percentage >= 90) {

        statusClass = "status-excellent";
        statusText = "Excellent";
        excellentCount++;

    } else if (percentage >= 80) {

        statusClass = "status-good";
        statusText = "Good";
        goodCount++;

    } else if (percentage >= 75) {

        statusClass = "status-average";
        statusText = "Average";
        averageCount++;

    } else {

        statusClass = "status-poor";
        statusText = "Poor";
        poorCount++;

    }


    // Create table row

    const row = document.createElement("tr");

    row.innerHTML = `

        <td>${subject.name}</td>

        <td>${subject.total}</td>

        <td>${subject.attended}</td>

        <td>${subject.absent}</td>

        <td class="percentage-${statusText.toLowerCase()}">
            ${percentage}%
        </td>

        <td>
            <span class="status-badge ${statusClass}">
                ${statusText}
            </span>
        </td>

    `;

    reportTableBody.appendChild(row);

});


// ==========================================
// UPDATE PERFORMANCE COUNTS
// ==========================================

document.getElementById("excellentCount").textContent =
    excellentCount;

document.getElementById("goodCount").textContent =
    goodCount;

document.getElementById("averageCount").textContent =
    averageCount;

document.getElementById("poorCount").textContent =
    poorCount;


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
