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
// CALENDAR ATTENDANCE DATA & STATE
// ==========================================

let currentDate = new Date();
let attendanceData = {};


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    if (!student) return;

    // Student information
    setElText("studentName", student.name);
    setElText("rollNo", student.rollNo);
    setElText("topStudentName", student.name);
    setElText("topStudentRoll", student.rollNo);
    setElText("department", student.department || "CSE");
    setElText("year", student.year || "4th Year");
    setElText("semester", student.semester || "7th Semester");

    setupMenuAndEvents();

    // 1. Initial cached render
    attendanceData = getCalendarAttendanceData(student.rollNo);
    renderCalendar();

    // 2. Load live attendance from Supabase & subscribe to Realtime
    loadLiveCalendarAttendance();

});


// ==========================================
// LOAD LIVE CALENDAR ATTENDANCE (SUPABASE + REALTIME)
// ==========================================

async function loadLiveCalendarAttendance() {

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
                        date
                    )
                `)
                .eq('student_id', studentId);

            if (!error && Array.isArray(records) && records.length > 0) {
                records.forEach(r => {
                    const d = r.attendance_sessions?.date;
                    if (d) {
                        attendanceData[d] = r.status || 'present';
                    }
                });

                renderCalendar();
            }
        }

        await fetchAndRender();

        // Subscribe to Realtime updates on attendance_records for this student
        window.supabaseClient
            .channel(`calendar-attendance-${student.rollNo}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_records',
                    filter: `student_id=eq.${studentId}`
                },
                (payload) => {
                    console.info('[Realtime] Calendar attendance update received:', payload);
                    fetchAndRender();
                }
            )
            .subscribe();

    } catch (err) {
        console.warn('[Calendar] Supabase live calendar error, using fallback:', err);
    }

}


// ==========================================
// ATTENDANCE DATA FROM STORAGE / FALLBACK
// ==========================================

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
// RENDER CALENDAR
// ==========================================

function renderCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    setElText("monthYear", monthNames[month] + " " + year);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;
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

        const dateStr = year + "-" + 
                       String(month + 1).padStart(2, "0") + "-" + 
                       String(date).padStart(2, "0");

        const dayOfWeek = new Date(year, month, date).getDay();

        if (dayOfWeek === 0) {
            day.classList.add("holiday");
            day.innerHTML = "🏠";
        } else if (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === date
        ) {
            day.classList.add("today");
            if (attendanceData[dateStr] === "present") {
                day.classList.add("present");
                day.innerHTML = date + " ✅";
            } else if (attendanceData[dateStr] === "absent") {
                day.classList.add("absent");
                day.innerHTML = date + " ❌";
            } else {
                day.textContent = date;
            }
        } else if (attendanceData[dateStr]) {
            if (attendanceData[dateStr] === "present") {
                day.classList.add("present");
                day.innerHTML = date + " ✅";
            } else if (attendanceData[dateStr] === "absent") {
                day.classList.add("absent");
                day.innerHTML = date + " ❌";
            }
        } else {
            day.textContent = date;
        }

        day.setAttribute("data-date", dateStr);
        calendarDays.appendChild(day);
    }

    // Add next month's days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;

    for (let date = 1; date <= remainingCells; date++) {
        const day = document.createElement("div");
        day.className = "calendar-day other-month";
        day.textContent = date;
        calendarDays.appendChild(day);
    }

    updateStatistics();

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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
                } else if (attendanceData[dateStr] === "absent") {
                    absences++;
                }
            }
        }
    }

    setElText("classesHeld", classesHeld);
    setElText("classesAttended", classesAttended);
    setElText("absences", absences);
    setElText("holidays", holidays);

}


// ==========================================
// MONTH NAVIGATION
// ==========================================

const prevBtn = document.getElementById("prevMonth");
if (prevBtn) {
    prevBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}

const nextBtn = document.getElementById("nextMonth");
if (nextBtn) {
    nextBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
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
