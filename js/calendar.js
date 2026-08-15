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
// ATTENDANCE DATA FOR CALENDAR (LIVE + DEMO)
// ==========================================

const attendanceData = getCalendarAttendanceData(student.rollNo);

function getCalendarAttendanceData(rollNo) {

    const data = {
        "2024-01-08": "present",
        "2024-01-09": "present",
        "2024-01-10": "present",
        "2024-01-11": "present",
        "2024-01-12": "present",
        "2024-01-15": "present",
        "2024-01-16": "present",
        "2024-01-17": "absent",
        "2024-01-18": "present",
        "2024-01-19": "present",
        "2024-01-22": "present",
        "2024-01-23": "present",
        "2024-01-24": "present",
        "2024-01-25": "present",
        "2024-01-26": "present",
        "2024-01-29": "present",
        "2024-01-30": "absent",
        "2024-01-31": "present"
    };

    // Scan real attendance from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('attendance_') && key !== 'attendance_records') {
            try {
                const record = JSON.parse(localStorage.getItem(key));
                if (record && record.date && record.students && record.students[rollNo]) {
                    data[record.date] = record.students[rollNo];
                }
            } catch (e) {}
        }
    }

    return data;

}


// ==========================================
// CALENDAR VARIABLES
// ==========================================

let currentDate = new Date();


// ==========================================
// RENDER CALENDAR
// ==========================================

function renderCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year heading
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    document.getElementById("monthYear").textContent =
        monthNames[month] + " " + year;


    // Get first day of month and number of days

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();


    // Clear calendar

    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";


    // Add previous month's days

    for (let i = firstDay - 1; i >= 0; i--) {

        const day = document.createElement("div");
        day.className = "calendar-day other-month";
        day.textContent = daysInPrevMonth - i;

        calendarDays.appendChild(day);

    }


    // Add current month's days

    const today = new Date();

    for (let date = 1; date <= daysInMonth; date++) {

        const day = document.createElement("div");
        day.className = "calendar-day";

        // Create date string
        const dateStr = year + "-" + 
                       String(month + 1).padStart(2, "0") + "-" + 
                       String(date).padStart(2, "0");

        // Get day of week
        const dayOfWeek = new Date(year, month, date).getDay();

        // Check if Sunday (holiday)
        if (dayOfWeek === 0) {

            day.classList.add("holiday");
            day.innerHTML = "🏠";

        }

        // Check if today
        else if (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === date
        ) {

            day.classList.add("today");
            day.textContent = date;

        }

        // Check attendance data
        else if (attendanceData[dateStr]) {

            if (attendanceData[dateStr] === "present") {

                day.classList.add("present");
                day.innerHTML = date + " ✅";

            } else if (attendanceData[dateStr] === "absent") {

                day.classList.add("absent");
                day.innerHTML = date + " ❌";

            }

        }

        else {

            day.textContent = date;

        }

        day.setAttribute("data-date", dateStr);
        calendarDays.appendChild(day);

    }


    // Add next month's days

    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days

    for (let date = 1; date <= remainingCells; date++) {

        const day = document.createElement("div");
        day.className = "calendar-day other-month";
        day.textContent = date;

        calendarDays.appendChild(day);

    }


    // Update statistics

    updateStatistics();

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Count Sundays (holidays)
    let holidays = 0;
    let classesHeld = 0;
    let classesAttended = 0;
    let absences = 0;


    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let date = 1; date <= daysInMonth; date++) {

        const dayOfWeek = new Date(year, month, date).getDay();

        if (dayOfWeek === 0) {

            holidays++;

        } else {

            classesHeld++;

            const dateStr = year + "-" + 
                           String(month + 1).padStart(2, "0") + "-" + 
                           String(date).padStart(2, "0");

            if (attendanceData[dateStr]) {

                if (attendanceData[dateStr] === "present") {
                    classesAttended++;
                } else {
                    absences++;
                }

            }

        }

    }


    // Update UI

    document.getElementById("classesHeld").textContent = classesHeld;
    document.getElementById("classesAttended").textContent = classesAttended;
    document.getElementById("absences").textContent = absences;
    document.getElementById("holidays").textContent = holidays;

}


// ==========================================
// MONTH NAVIGATION
// ==========================================

document
    .getElementById("prevMonth")
    .addEventListener("click", function () {

        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();

    });


document
    .getElementById("nextMonth")
    .addEventListener("click", function () {

        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();

    });


// ==========================================
// INITIAL RENDER
// ==========================================

renderCalendar();


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
