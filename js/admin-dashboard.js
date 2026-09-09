// ==============================================================================
// ADMIN DASHBOARD (PHASE 8)
// ==============================================================================
// Live metrics & analytics connected to Supabase ('students', 'classes',
// 'attendance_records', 'leave_requests') with Realtime updates, live dynamic
// recent activity stream, and seamless offline localStorage fallback.
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

    initializeDashboard();
});


// State
let realtimeChannel = null;


// Initialize Dashboard
function initializeDashboard() {
    setupMenuButton();
    setupLogoutButton();

    // 1. Initial cached render
    renderCachedMetrics();

    // 2. Load live metrics & activity from Supabase
    loadDashboardData();
    loadRecentActivity();

    // 3. Setup Realtime subscription
    setupRealtimeDashboard();
}


// ==============================================================================
// SUPABASE REALTIME SUBSCRIPTION
// ==============================================================================

function setupRealtimeDashboard() {
    if (!window.supabaseClient) return;

    try {
        if (realtimeChannel) {
            window.supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = window.supabaseClient
            .channel('public:admin_dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_records' },
                () => {
                    loadDashboardAttendance();
                    loadRecentActivity();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leave_requests' },
                () => {
                    loadDashboardLeaves();
                    loadRecentActivity();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'students' },
                () => {
                    loadDashboardStudents();
                    loadRecentActivity();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'classes' },
                () => {
                    loadDashboardClasses();
                }
            )
            .subscribe();
    } catch (err) {
        console.warn('[AdminDashboard] Realtime subscription error:', err);
    }
}


// ==============================================================================
// INITIAL CACHED METRICS
// ==============================================================================

function renderCachedMetrics() {
    const students = getStudentsList();
    const totalStudents = students.length;

    const classList = JSON.parse(localStorage.getItem('classList')) || getDefaultClasses();
    const totalClasses = classList.length;

    const attendanceData = getAttendanceData();
    const avgAttendance = calculateAverageAttendance(attendanceData, totalStudents);

    const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [
        { status: 'Pending' },
        { status: 'Pending' }
    ];
    const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending').length;

    setElText('totalStudents', totalStudents);
    setElText('totalClasses', totalClasses);
    setElText('avgAttendance', avgAttendance + '%');
    setElText('pendingLeaves', pendingLeaves);
}


// ==============================================================================
// LOAD LIVE METRICS FROM SUPABASE
// ==============================================================================

async function loadDashboardData() {
    await Promise.all([
        loadDashboardStudents(),
        loadDashboardClasses(),
        loadDashboardAttendance(),
        loadDashboardLeaves()
    ]);
}

async function loadDashboardStudents() {
    if (!window.supabaseClient) return;

    try {
        const { count, error } = await window.supabaseClient
            .from('students')
            .select('*', { count: 'exact', head: true });

        if (!error && count !== null && count !== undefined) {
            setElText('totalStudents', count);
        }
    } catch (err) {
        console.warn('[AdminDashboard] Student count error:', err);
    }
}

async function loadDashboardClasses() {
    if (!window.supabaseClient) return;

    try {
        const { count, error } = await window.supabaseClient
            .from('classes')
            .select('*', { count: 'exact', head: true });

        if (!error && count !== null && count !== undefined) {
            setElText('totalClasses', count);
        }
    } catch (err) {
        console.warn('[AdminDashboard] Classes count error:', err);
    }
}

async function loadDashboardLeaves() {
    if (!window.supabaseClient) return;

    try {
        const { count, error } = await window.supabaseClient
            .from('leave_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');

        if (!error && count !== null && count !== undefined) {
            setElText('pendingLeaves', count);
        }
    } catch (err) {
        console.warn('[AdminDashboard] Pending leaves count error:', err);
    }
}

async function loadDashboardAttendance() {
    if (!window.supabaseClient) return;

    try {
        // Compute average attendance from live Supabase records
        const { data, error } = await window.supabaseClient
            .from('attendance_records')
            .select('status')
            .limit(1000);

        if (!error && Array.isArray(data) && data.length > 0) {
            const present = data.filter(r => r.status === 'present').length;
            const percentage = Math.round((present / data.length) * 100);
            setElText('avgAttendance', percentage + '%');
        }
    } catch (err) {
        console.warn('[AdminDashboard] Attendance rate error:', err);
    }
}


// ==============================================================================
// RECENT ACTIVITY FEED
// ==============================================================================

async function loadRecentActivity() {
    const listEl = document.getElementById('activityList');
    if (!listEl) return;

    const activities = [];

    if (window.supabaseClient) {
        try {
            // 1. Recent attendance sessions
            const { data: sessions } = await window.supabaseClient
                .from('attendance_sessions')
                .select('date, created_at, classes(class_code), subjects(subject_name)')
                .order('created_at', { ascending: false })
                .limit(2);

            if (sessions) {
                sessions.forEach(s => {
                    const cCode = (s.classes && s.classes.class_code) || 'Class';
                    const sName = (s.subjects && s.subjects.subject_name) || 'Subject';
                    activities.push({
                        icon: '📋',
                        title: `Attendance marked for ${cCode} (${sName})`,
                        time: formatRelativeTime(s.created_at || s.date),
                        timestamp: new Date(s.created_at || s.date).getTime()
                    });
                });
            }

            // 2. Recent leave requests
            const { data: leaves } = await window.supabaseClient
                .from('leave_requests')
                .select('student_id, type, status, created_at, updated_at')
                .order('created_at', { ascending: false })
                .limit(2);

            if (leaves) {
                leaves.forEach(l => {
                    const isApproved = l.status === 'Approved';
                    activities.push({
                        icon: isApproved ? '✅' : '📝',
                        title: `Leave request ${l.status.toLowerCase()} (${l.type})`,
                        time: formatRelativeTime(l.updated_at || l.created_at),
                        timestamp: new Date(l.updated_at || l.created_at).getTime()
                    });
                });
            }

            // 3. Recent notifications or students
            const { data: recentStudents } = await window.supabaseClient
                .from('students')
                .select('roll_number, name, created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (recentStudents && recentStudents[0]) {
                const st = recentStudents[0];
                activities.push({
                    icon: '👥',
                    title: `Student record synced: ${st.roll_number}`,
                    time: formatRelativeTime(st.created_at),
                    timestamp: new Date(st.created_at).getTime()
                });
            }
        } catch (err) {
            console.warn('[AdminDashboard] Error loading live activity:', err);
        }
    }

    if (activities.length === 0) {
        // Fallback demo activities
        listEl.innerHTML = `
            <div class="activity-item">
                <span class="activity-icon">📋</span>
                <div class="activity-content">
                    <p class="activity-title">Attendance marked for CSE-A (Web Technologies)</p>
                    <span class="activity-time">Today at 10:30 AM</span>
                </div>
            </div>
            <div class="activity-item">
                <span class="activity-icon">👥</span>
                <div class="activity-content">
                    <p class="activity-title">Academic structure & faculty records verified</p>
                    <span class="activity-time">Today at 09:15 AM</span>
                </div>
            </div>
            <div class="activity-item">
                <span class="activity-icon">✅</span>
                <div class="activity-content">
                    <p class="activity-title">Leave request reviewed and approved</p>
                    <span class="activity-time">Yesterday at 03:45 PM</span>
                </div>
            </div>
        `;
        return;
    }

    // Sort descending by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);

    listEl.innerHTML = activities.slice(0, 4).map(act => `
        <div class="activity-item">
            <span class="activity-icon">${act.icon}</span>
            <div class="activity-content">
                <p class="activity-title">${act.title}</p>
                <span class="activity-time">${act.time}</span>
            </div>
        </div>
    `).join('');
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Recently';

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


// ==============================================================================
// LOCAL STORAGE DATA HELPERS
// ==============================================================================

function getStudentsList() {
    const stored = localStorage.getItem('adminStudentsList');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {}
    }
    return [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR" }
    ];
}

function getDefaultClasses() {
    return [
        { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year' },
        { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year' },
        { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year' },
        { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year' },
        { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year' }
    ];
}

function calculateAverageAttendance(attendanceData, totalStudents) {
    let totalPresent = 0;
    let totalRecords = 0;

    for (const date in attendanceData) {
        const dayData = attendanceData[date];
        if (dayData.students) {
            for (const studentId in dayData.students) {
                const status = dayData.students[studentId];
                if (status === 'present') totalPresent++;
                totalRecords++;
            }
        }
    }

    if (totalRecords === 0) return 88;
    return Math.round((totalPresent / totalRecords) * 100);
}

function getAttendanceData() {
    const attendanceData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('attendance_') && key !== 'attendance_records') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                attendanceData[key] = data;
            } catch (e) {}
        }
    }
    return attendanceData;
}


// ==============================================================================
// NAVIGATION & LOGOUT
// ==============================================================================

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
            window.location.href = 'index.html';
        }
    });
}
