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
// LOGIN VALIDATION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    const savedAdmin = localStorage.getItem('loggedInAdmin');
    const savedStudent = localStorage.getItem('loggedInStudent');

    if (!savedAdmin || savedStudent) {
        window.location.href = 'index.html';
        return;
    }

    initializeReportsPage();

});


// ==========================================
// INITIALIZE REPORTS PAGE
// ==========================================

function initializeReportsPage() {

    setupMenuButton();
    setupLogoutButton();
    setupDateInputs();
    setupGenerateButton();
    generateReport(); // Initial load

}


// ==========================================
// DEFAULT DATES
// ==========================================

function setupDateInputs() {

    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    endInput.value = today.toISOString().split('T')[0];
    startInput.value = firstDay.toISOString().split('T')[0];

}


// ==========================================
// GENERATE REPORT BUTTON
// ==========================================

function setupGenerateButton() {

    const btn = document.getElementById('generateReportBtn');
    btn.addEventListener('click', generateReport);

}


// ==========================================
// GET ALL ATTENDANCE RECORDS
// ==========================================

function getAllAttendanceRecords() {

    const records = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('attendance_') && key !== 'attendance_records') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.students) {
                    records.push(data);
                }
            } catch (e) {
                console.error("Error parsing attendance record:", key, e);
            }
        }
    }

    return records;

}


// ==========================================
// GET STUDENTS
// ==========================================

function getStudentsList() {

    const stored = localStorage.getItem('adminStudentsList');
    if (stored) return JSON.parse(stored);

    return [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY", department: "CSE" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI", department: "CSE" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG", department: "CSE" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR", department: "CSE" },
        { rollNo: "23RU1A0505", name: "AYYAPPA REDDY YAMINI", department: "CSE" }
    ];

}


// ==========================================
// GENERATE REPORT
// ==========================================

function generateReport() {

    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let records = getAllAttendanceRecords();

    // Filter by date range if provided
    if (startDate) {
        records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
        records = records.filter(r => r.date <= endDate);
    }

    // Calculate Summary Stats
    let totalClassesHeld = records.length;
    let totalPresent = 0;
    let totalAbsent = 0;

    records.forEach(r => {
        for (const sId in r.students) {
            if (r.students[sId] === 'present') {
                totalPresent++;
            } else {
                totalAbsent++;
            }
        }
    });

    const totalMarked = totalPresent + totalAbsent;
    const overallPct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : (totalClassesHeld > 0 ? 85 : 0);

    // Update Summary Cards
    document.getElementById('totalClassesHeld').textContent = totalClassesHeld;
    document.getElementById('totalPresent').textContent = totalPresent;
    document.getElementById('totalAbsent').textContent = totalAbsent;
    document.getElementById('overallPercentage').textContent = overallPct + '%';

    // Render Detailed Table
    renderDetailedTable(reportType, records);

}


// ==========================================
// RENDER DETAILED TABLE
// ==========================================

function renderDetailedTable(reportType, records) {

    const tableSection = document.getElementById('reportTable');
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');

    tableSection.classList.remove('hidden');
    tableBody.innerHTML = '';

    if (reportType === 'student') {
        // STUDENT-WISE REPORT
        tableHead.innerHTML = `
            <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Percentage</th>
            </tr>
        `;

        const students = getStudentsList();
        const studentStats = {};

        students.forEach(s => {
            studentStats[s.rollNo] = {
                rollNo: s.rollNo,
                name: s.name,
                total: 0,
                present: 0,
                absent: 0
            };
        });

        records.forEach(r => {
            for (const sId in r.students) {
                if (!studentStats[sId]) {
                    studentStats[sId] = { rollNo: sId, name: sId, total: 0, present: 0, absent: 0 };
                }
                studentStats[sId].total++;
                if (r.students[sId] === 'present') {
                    studentStats[sId].present++;
                } else {
                    studentStats[sId].absent++;
                }
            }
        });

        const list = Object.values(studentStats);

        if (list.length === 0 || records.length === 0) {
            // Provide default view if no records yet
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No attendance sessions recorded for this filter. Please mark attendance first.</td></tr>`;
            return;
        }

        list.forEach(s => {
            const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
            const pctClass = pct >= 75 ? 'percentage-good' : (pct >= 65 ? 'percentage-warning' : 'percentage-danger');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${s.rollNo}</strong></td>
                <td>${s.name}</td>
                <td>${s.total}</td>
                <td>${s.present}</td>
                <td>${s.absent}</td>
                <td class="${pctClass}">${pct}%</td>
            `;
            tableBody.appendChild(row);
        });

    } else if (reportType === 'subject') {
        // SUBJECT-WISE REPORT
        tableHead.innerHTML = `
            <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Sessions Held</th>
                <th>Total Present</th>
                <th>Total Absent</th>
                <th>Average %</th>
            </tr>
        `;

        const subjectStats = {};

        records.forEach(r => {
            const key = r.subjectCode || 'General';
            if (!subjectStats[key]) {
                subjectStats[key] = {
                    code: key,
                    name: r.subjectName || key,
                    sessions: 0,
                    present: 0,
                    absent: 0
                };
            }
            subjectStats[key].sessions++;
            for (const sId in r.students) {
                if (r.students[sId] === 'present') {
                    subjectStats[key].present++;
                } else {
                    subjectStats[key].absent++;
                }
            }
        });

        const list = Object.values(subjectStats);

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No subject attendance recorded yet.</td></tr>`;
            return;
        }

        list.forEach(sub => {
            const total = sub.present + sub.absent;
            const pct = total > 0 ? Math.round((sub.present / total) * 100) : 0;
            const pctClass = pct >= 75 ? 'percentage-good' : (pct >= 65 ? 'percentage-warning' : 'percentage-danger');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${sub.code}</strong></td>
                <td>${sub.name}</td>
                <td>${sub.sessions}</td>
                <td>${sub.present}</td>
                <td>${sub.absent}</td>
                <td class="${pctClass}">${pct}%</td>
            `;
            tableBody.appendChild(row);
        });

    } else if (reportType === 'class') {
        // CLASS-WISE REPORT
        tableHead.innerHTML = `
            <tr>
                <th>Class Code</th>
                <th>Sessions Held</th>
                <th>Total Present Marks</th>
                <th>Total Absent Marks</th>
                <th>Average Attendance</th>
            </tr>
        `;

        const classStats = {};

        records.forEach(r => {
            const key = r.classCode || 'CSE-A';
            if (!classStats[key]) {
                classStats[key] = {
                    code: key,
                    sessions: 0,
                    present: 0,
                    absent: 0
                };
            }
            classStats[key].sessions++;
            for (const sId in r.students) {
                if (r.students[sId] === 'present') {
                    classStats[key].present++;
                } else {
                    classStats[key].absent++;
                }
            }
        });

        const list = Object.values(classStats);

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #888;">No class attendance recorded yet.</td></tr>`;
            return;
        }

        list.forEach(cls => {
            const total = cls.present + cls.absent;
            const pct = total > 0 ? Math.round((cls.present / total) * 100) : 0;
            const pctClass = pct >= 75 ? 'percentage-good' : (pct >= 65 ? 'percentage-warning' : 'percentage-danger');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${cls.code}</strong></td>
                <td>${cls.sessions}</td>
                <td>${cls.present}</td>
                <td>${cls.absent}</td>
                <td class="${pctClass}">${pct}%</td>
            `;
            tableBody.appendChild(row);
        });

    } else {
        // OVERALL SESSION-BY-SESSION LOG
        tableHead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Session %</th>
            </tr>
        `;

        if (records.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">No attendance sessions found in this date range.</td></tr>`;
            return;
        }

        records.forEach(r => {
            let present = 0;
            let absent = 0;
            for (const sId in r.students) {
                if (r.students[sId] === 'present') present++;
                else absent++;
            }
            const total = present + absent;
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
            const pctClass = pct >= 75 ? 'percentage-good' : (pct >= 65 ? 'percentage-warning' : 'percentage-danger');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${r.date}</td>
                <td><strong>${r.classCode || 'CSE-A'}</strong></td>
                <td>${r.subjectName || r.subjectCode || 'General'}</td>
                <td>${present}</td>
                <td>${absent}</td>
                <td class="${pctClass}">${pct}%</td>
            `;
            tableBody.appendChild(row);
        });
    }

}


// ==========================================
// MENU BUTTON
// ==========================================

function setupMenuButton() {

    const menuButton = document.getElementById('menuButton');
    const sidebar = document.getElementById('sidebar');

    if (!menuButton || !sidebar) return;

    menuButton.addEventListener('click', function () {
        sidebar.classList.toggle('mobile-open');
    });

    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !menuButton.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

}


// ==========================================
// LOGOUT BUTTON
// ==========================================

function setupLogoutButton() {

    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', function () {
        if (confirm('🚪 Are you sure you want to logout?')) {
            localStorage.removeItem('loggedInAdmin');
            localStorage.removeItem('loggedInStudent');
            window.location.href = 'index.html';
        }
    });

}
