// ==============================================================================
// STUDENT ATTENDANCE REPORTS & ANALYTICS (PHASE 7)
// ==============================================================================
// Computes live metrics, 6-month trends, subject breakdown, shortage insights,
// and smart recommendations directly from Supabase with local fallback.
// ==============================================================================

// Apply Dark Mode from Storage
function applyDarkModeFromStorage() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}
applyDarkModeFromStorage();


// Check Login
const savedStudent = localStorage.getItem("loggedInStudent");
const savedAdmin = localStorage.getItem("loggedInAdmin");

if (!savedStudent && !savedAdmin) {
    window.location.href = "index.html";
}

if (savedAdmin && !savedStudent) {
    window.location.href = "admin-dashboard.html";
}

const student = JSON.parse(savedStudent || "{}");
let currentStudentUuid = null;


// Initialize Page
document.addEventListener("DOMContentLoaded", function () {
    // 1. Populate Basic Student Info
    setElementText("studentName", student.name || "Student");
    setElementText("rollNo", student.rollNo || "-");
    setElementText("topStudentName", student.name || "Student");
    setElementText("topStudentRoll", student.rollNo || "-");
    setElementText("department", student.department || "CSE");
    setElementText("year", student.year || "4th Year");
    setElementText("semester", student.semester || "7th Semester");

    setupMenu();
    setupLogout();

    // 2. Initial Render from Cached / Local Data
    const localData = getStudentReportData(student.rollNo);
    renderReportUI(localData.yearlyData, localData.subjects, localData.monthlyTrend);

    // 3. Load Live Data from Supabase & Subscribe to Realtime
    loadLiveStudentReport();
    setupRealtimeStudentReports();
});


// Helper to set element text
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


// Load Live Report Data from Supabase
async function loadLiveStudentReport() {
    if (!window.supabaseClient || !student || !student.rollNo) return;

    try {
        // Resolve student UUID
        if (!currentStudentUuid) {
            const { data: s } = await window.supabaseClient
                .from('students')
                .select('id')
                .eq('roll_number', student.rollNo)
                .maybeSingle();
            if (s?.id) currentStudentUuid = s.id;
        }

        if (!currentStudentUuid) return;

        // Fetch live attendance records joined with sessions and subjects
        const { data: records, error } = await window.supabaseClient
            .from('attendance_records')
            .select(`
                status,
                attendance_sessions (
                    date,
                    subjects ( subject_name, subject_code )
                )
            `)
            .eq('student_id', currentStudentUuid);

        if (error || !records) {
            console.warn('Supabase report query error:', error);
            return;
        }

        if (records.length === 0) return;

        let totalAttended = 0;
        let totalAbsent = 0;
        const subjectMap = {};
        const monthMap = {};

        records.forEach(r => {
            const isPresent = r.status === 'Present';
            const subName = r.attendance_sessions?.subjects?.subject_name || 'General';
            const dateStr = r.attendance_sessions?.date;

            // Overall
            if (isPresent) totalAttended++;
            else totalAbsent++;

            // Subject-wise
            if (!subjectMap[subName]) {
                subjectMap[subName] = { name: subName, total: 0, attended: 0, absent: 0 };
            }
            subjectMap[subName].total++;
            if (isPresent) subjectMap[subName].attended++;
            else subjectMap[subName].absent++;

            // Monthly breakdown
            if (dateStr) {
                const d = new Date(dateStr);
                const monthKey = d.toLocaleString('en-US', { month: 'short' });
                if (!monthMap[monthKey]) {
                    monthMap[monthKey] = { attended: 0, total: 0 };
                }
                monthMap[monthKey].total++;
                if (isPresent) monthMap[monthKey].attended++;
            }
        });

        const totalHeld = totalAttended + totalAbsent;
        const overallPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0;

        const yearlyData = {
            overallAttendance: overallPct,
            totalClassesHeld: totalHeld,
            classesAttended: totalAttended,
            classesAbsent: totalAbsent
        };

        const subjectsList = Object.values(subjectMap);

        // Compute monthly trend
        const monthNames = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
        const monthlyTrend = monthNames.map(m => {
            const stats = monthMap[m];
            const pct = stats && stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 82;
            return { month: m, percentage: pct };
        });

        // Re-render UI with live data
        renderReportUI(yearlyData, subjectsList, monthlyTrend);

    } catch (err) {
        console.error('Error loading live student report:', err);
    }
}


// Realtime Student Report Listener
function setupRealtimeStudentReports() {
    if (!window.supabaseClient) return;

    try {
        window.supabaseClient
            .channel('realtime:student_reports')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_records' },
                () => {
                    console.log('🔄 Attendance changed in Supabase! Refreshing student report...');
                    loadLiveStudentReport();
                }
            )
            .subscribe();
    } catch (e) {}
}


// Fallback / Local Storage Data
function getStudentReportData(rollNo) {
    let totalAttended = 0;
    let totalAbsent = 0;
    const subjectMap = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('attendance_') && key !== 'attendance_records') {
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
            subjects: Object.values(subjectMap),
            monthlyTrend: [
                { month: "Aug", percentage: 75 },
                { month: "Sep", percentage: 82 },
                { month: "Oct", percentage: 78 },
                { month: "Nov", percentage: 85 },
                { month: "Dec", percentage: 88 },
                { month: "Jan", percentage: overallAttendance }
            ]
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
        ],
        monthlyTrend: [
            { month: "Aug", percentage: 75 },
            { month: "Sep", percentage: 82 },
            { month: "Oct", percentage: 78 },
            { month: "Nov", percentage: 85 },
            { month: "Dec", percentage: 88 },
            { month: "Jan", percentage: 82 }
        ]
    };
}


// Render Report UI (Stats, Subject Table, Performance Counts, Recommendations)
function renderReportUI(yearlyData, subjects, monthlyTrend) {

    // 1. Update Overview Cards
    setElementText("ytdAttendance", yearlyData.overallAttendance + "%");
    setElementText("totalHeld", yearlyData.totalClassesHeld);
    setElementText("totalAttended", yearlyData.classesAttended);
    setElementText("totalAbsent", yearlyData.classesAbsent);

    // 2. Update Monthly Trend Chart
    const chartBars = document.querySelectorAll(".attendance-chart .chart-bar");
    if (chartBars && monthlyTrend) {
        chartBars.forEach((barEl, index) => {
            if (monthlyTrend[index]) {
                const val = monthlyTrend[index].percentage;
                const bar = barEl.querySelector(".bar");
                const barVal = barEl.querySelector(".bar-value");
                if (bar) {
                    bar.style.height = val + "%";
                    bar.style.background = val >= 85 ? "#27ae60" : (val >= 75 ? "#3498db" : "#e74c3c");
                }
                if (barVal) barVal.textContent = val + "%";
            }
        });
    }

    // 3. Update Subject Report Table
    const reportTableBody = document.getElementById("reportTableBody");
    if (!reportTableBody) return;

    reportTableBody.innerHTML = "";

    let excellentCount = 0;
    let goodCount = 0;
    let averageCount = 0;
    let poorCount = 0;
    let lowestSubject = null;

    subjects.forEach(function (subject) {
        const percentage = subject.total > 0
            ? Math.round((subject.attended / subject.total) * 100)
            : 0;

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

        if (!lowestSubject || percentage < lowestSubject.percentage) {
            lowestSubject = { name: subject.name, percentage, attended: subject.attended, total: subject.total };
        }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(subject.name)}</td>
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

    // 4. Update Performance Category Counts
    setElementText("excellentCount", excellentCount);
    setElementText("goodCount", goodCount);
    setElementText("averageCount", averageCount);
    setElementText("poorCount", poorCount);

    // 5. Update Attendance Distribution Pie Chart
    const pieLabel = document.querySelector(".pie-label");
    if (pieLabel) pieLabel.textContent = yearlyData.overallAttendance + "%";

    const legendItems = document.querySelectorAll(".pie-legend .legend-item span:last-child");
    if (legendItems.length >= 2) {
        legendItems[0].textContent = `Attended (${yearlyData.classesAttended})`;
        legendItems[1].textContent = `Absent (${yearlyData.classesAbsent})`;
    }

    // 6. Update Dynamic Recommendations
    updateRecommendations(yearlyData.overallAttendance, lowestSubject);
}


// Dynamic Smart Recommendations
function updateRecommendations(overallPct, lowestSubject) {
    const recCards = document.querySelectorAll(".recommendation-card");
    if (!recCards || recCards.length < 3) return;

    // Card 1: Consistency
    const card1 = recCards[0].querySelector("div");
    if (card1) {
        if (overallPct >= 85) {
            card1.innerHTML = `<h4>Outstanding Attendance</h4><p>Your overall attendance is ${overallPct}%. Keep maintaining this stellar consistency!</p>`;
        } else if (overallPct >= 75) {
            card1.innerHTML = `<h4>Maintain Consistency</h4><p>Your attendance is ${overallPct}%. Try to attend upcoming classes to comfortably surpass 85%.</p>`;
        } else {
            card1.innerHTML = `<h4>⚠️ Critical Shortage Warning</h4><p>Your overall attendance is ${overallPct}% (below 75%). Immediate regular attendance is mandatory.</p>`;
        }
    }

    // Card 2: Subject Focus
    const card2 = recCards[1].querySelector("div");
    if (card2 && lowestSubject) {
        if (lowestSubject.percentage < 75) {
            const needed = Math.max(1, Math.ceil(3 * lowestSubject.total - 4 * lowestSubject.attended));
            card2.innerHTML = `<h4>Focus on ${escapeHtml(lowestSubject.name)}</h4><p>Attendance is ${lowestSubject.percentage}%. You need ${needed} consecutive class${needed > 1 ? 'es' : ''} to reach 75%.</p>`;
        } else {
            card2.innerHTML = `<h4>Subject Stability</h4><p>All enrolled subjects are currently above 75%. Continue your steady engagement.</p>`;
        }
    }

    // Card 3: Workload & Leave Advice
    const card3 = recCards[2].querySelector("div");
    if (card3) {
        if (overallPct > 80) {
            card3.innerHTML = `<h4>Safe Leave Cushion</h4><p>With ${overallPct}% attendance, you have a safe buffer for planned leaves without falling into shortage.</p>`;
        } else {
            card3.innerHTML = `<h4>Minimize Absences</h4><p>Your buffer is tight. Avoid taking non-essential leaves until your attendance recovers.</p>`;
        }
    }
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
function setupMenu() {
    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    if (!menuButton || !sidebar) return;

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

function setupLogout() {
    const logoutBtn = document.getElementById("logoutButton");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", function () {
        if (confirm("🚪 Are you sure you want to logout?")) {
            localStorage.removeItem("loggedInStudent");
            localStorage.removeItem("loggedInAdmin");
            if (window.supabaseClient?.auth) {
                window.supabaseClient.auth.signOut().catch(() => {});
            }
            window.location.href = "index.html";
        }
    });
}
