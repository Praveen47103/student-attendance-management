// ==============================================================================
// ADMIN ATTENDANCE REPORTS & ANALYTICS (PHASE 7)
// ==============================================================================
// Connected to Supabase attendance tables with shortage analysis,
// dynamic filtering, CSV export, and local storage fallback.
// ==============================================================================

// Apply Dark Mode from Storage
function applyDarkModeFromStorage() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}
applyDarkModeFromStorage();


// Login Validation
document.addEventListener('DOMContentLoaded', function () {
    const savedAdmin = localStorage.getItem('loggedInAdmin');
    const savedStudent = localStorage.getItem('loggedInStudent');

    if (!savedAdmin || savedStudent) {
        window.location.href = 'index.html';
        return;
    }

    initializeReportsPage();
});


// Initialize Reports Page
function initializeReportsPage() {
    setupMenuButton();
    setupLogoutButton();
    setupDateInputs();
    setupGenerateButton();
    setupExportButton();

    // Initial load
    generateReport();

    // Subscribe to Realtime attendance updates
    setupRealtimeReports();
}


// Setup Default Date Range (Current Month)
function setupDateInputs() {
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    endInput.value = today.toISOString().split('T')[0];
    startInput.value = firstDay.toISOString().split('T')[0];
}


// Setup Generate Button
function setupGenerateButton() {
    const btn = document.getElementById('generateReportBtn');
    if (btn) btn.addEventListener('click', () => generateReport());
}


// Setup CSV Export Button
function setupExportButton() {
    const btn = document.getElementById('exportCsvBtn');
    if (btn) btn.addEventListener('click', exportReportToCSV);
}


// Fetch All Attendance Records (Supabase + Local Cache)
async function getAllAttendanceRecords() {
    const recordsMap = {};

    // 1. Fetch from Supabase if connected
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('attendance_sessions')
                .select(`
                    id,
                    date,
                    classes ( class_code ),
                    subjects ( subject_code, subject_name ),
                    attendance_records (
                        status,
                        students ( id, roll_number, name )
                    )
                `)
                .order('date', { ascending: false });

            if (!error && Array.isArray(data)) {
                data.forEach(sess => {
                    const classCode = sess.classes?.class_code || 'CSE-A';
                    const subjectCode = sess.subjects?.subject_code || 'General';
                    const subjectName = sess.subjects?.subject_name || subjectCode;
                    const sessionDate = sess.date;

                    const studentsMap = {};
                    if (Array.isArray(sess.attendance_records)) {
                        sess.attendance_records.forEach(rec => {
                            const roll = rec.students?.roll_number;
                            if (roll) {
                                studentsMap[roll] = rec.status === 'Present' ? 'present' : 'absent';
                            }
                        });
                    }

                    const key = `${classCode}_${subjectCode}_${sessionDate}`;
                    recordsMap[key] = {
                        date: sessionDate,
                        classCode: classCode,
                        subjectCode: subjectCode,
                        subjectName: subjectName,
                        students: studentsMap
                    };
                });
            }
        } catch (err) {
            console.warn('Error querying Supabase attendance sessions:', err);
        }
    }

    // 2. Merge with LocalStorage attendance records
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('attendance_') && key !== 'attendance_records') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data.students && data.date) {
                    const sessionKey = `${data.classCode || 'CSE-A'}_${data.subjectCode || 'General'}_${data.date}`;
                    if (!recordsMap[sessionKey]) {
                        recordsMap[sessionKey] = data;
                    }
                }
            } catch (e) {}
        }
    }

    return Object.values(recordsMap);
}


// Get Students List (Supabase + LocalStorage Fallback)
async function getStudentsList() {
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('students')
                .select('roll_number, name, department')
                .order('roll_number', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                return data.map(s => ({
                    rollNo: s.roll_number,
                    name: s.name,
                    department: s.department || 'CSE'
                }));
            }
        } catch (e) {}
    }

    const stored = localStorage.getItem('adminStudentsList');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {}
    }

    return [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY", department: "CSE" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI", department: "CSE" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG", department: "CSE" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR", department: "CSE" },
        { rollNo: "23RU1A0505", name: "AYYAPPA REDDY YAMINI", department: "CSE" }
    ];
}


// Realtime Reports Listener
function setupRealtimeReports() {
    if (!window.supabaseClient) return;

    try {
        window.supabaseClient
            .channel('realtime:reports_attendance')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_records' },
                () => {
                    console.log('🔄 Realtime attendance change detected! Refreshing reports...');
                    generateReport();
                }
            )
            .subscribe();
    } catch (e) {}
}


// Generate Attendance Report & Analytics
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let records = await getAllAttendanceRecords();
    const allStudents = await getStudentsList();

    // Filter by date range
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

    // Render Detailed Report Table
    renderDetailedTable(reportType, records, allStudents);
}


// Render Detailed Table by Type
function renderDetailedTable(reportType, records, allStudents) {
    const tableSection = document.getElementById('reportTable');
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');

    tableSection.classList.remove('hidden');
    tableBody.innerHTML = '';

    if (reportType === 'student' || reportType === 'shortage') {
        // STUDENT-WISE OR ATTENDANCE SHORTAGE REPORT (<75%)
        const isShortage = reportType === 'shortage';

        tableHead.innerHTML = `
            <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Percentage</th>
                ${isShortage ? '<th>Shortage Recovery Advice</th>' : ''}
            </tr>
        `;

        const studentStats = {};
        (allStudents || []).forEach(s => {
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

        let list = Object.values(studentStats);

        // Filter for shortage if requested
        if (isShortage) {
            list = list.filter(s => {
                const pct = s.total > 0 ? (s.present / s.total) * 100 : 0;
                return pct < 75;
            });
        }

        if (list.length === 0) {
            const emptyMsg = isShortage
                ? '🎉 Excellent! No students have attendance below the 75% threshold in this range.'
                : 'No attendance records found for this date range.';
            tableBody.innerHTML = `<tr><td colspan="${isShortage ? 7 : 6}" style="text-align: center; padding: 25px; color: #888;">${emptyMsg}</td></tr>`;
            return;
        }

        list.forEach(s => {
            const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
            const pctClass = pct >= 75 ? 'percentage-good' : (pct >= 65 ? 'percentage-warning' : 'percentage-danger');

            let recoveryAdvice = '';
            if (isShortage) {
                // Formula to reach 75%: (present + x) / (total + x) >= 0.75 => x = ceil(3*total - 4*present)
                const needed = Math.max(1, Math.ceil(3 * s.total - 4 * s.present));
                recoveryAdvice = `<td style="color: #e74c3c; font-weight: 600;">⚠️ Needs ${needed} consecutive class${needed > 1 ? 'es' : ''}</td>`;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${escapeHtml(s.rollNo)}</strong></td>
                <td>${escapeHtml(s.name)}</td>
                <td>${s.total}</td>
                <td>${s.present}</td>
                <td>${s.absent}</td>
                <td class="${pctClass}">${pct}%</td>
                ${recoveryAdvice}
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
                <td><strong>${escapeHtml(sub.code)}</strong></td>
                <td>${escapeHtml(sub.name)}</td>
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
                <td><strong>${escapeHtml(cls.code)}</strong></td>
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
                <td><strong>${escapeHtml(r.classCode || 'CSE-A')}</strong></td>
                <td>${escapeHtml(r.subjectName || r.subjectCode || 'General')}</td>
                <td>${present}</td>
                <td>${absent}</td>
                <td class="${pctClass}">${pct}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
}


// Export Current Report to CSV
function exportReportToCSV() {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');

    if (!tableHead || !tableBody) return;

    const rows = [];

    // Header Row
    const headers = [];
    tableHead.querySelectorAll('th').forEach(th => {
        headers.push(`"${th.textContent.trim().replace(/"/g, '""')}"`);
    });
    rows.push(headers.join(','));

    // Body Rows
    tableBody.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td').forEach(td => {
            cells.push(`"${td.textContent.trim().replace(/"/g, '""')}"`);
        });
        if (cells.length > 0) {
            rows.push(cells.join(','));
        }
    });

    if (rows.length <= 1) {
        alert('⚠️ No data to export.');
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    const reportType = document.getElementById('reportType').value;
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', csvContent);
    link.setAttribute('download', `attendance_report_${reportType}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// Navigation & Logout
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

function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', function () {
        if (confirm('🚪 Are you sure you want to logout?')) {
            localStorage.removeItem('loggedInAdmin');
            localStorage.removeItem('loggedInStudent');
            if (window.supabaseClient?.auth) {
                window.supabaseClient.auth.signOut().catch(() => {});
            }
            window.location.href = 'index.html';
        }
    });
}
