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

    // 4. Setup Announcement Module & Load Announcements
    setupAnnouncementModule();
    loadRecentAnnouncements();
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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    loadRecentAnnouncements();
                    loadRecentActivity();
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


// ==============================================================================
// ANNOUNCEMENT & BROADCAST NOTIFICATION MODULE (PHASE 9)
// ==============================================================================

let cachedDashboardClasses = [];
let cachedDashboardStudents = [];

function setupAnnouncementModule() {
    const openBtn = document.getElementById('openAnnouncementModalBtn');
    const modal = document.getElementById('announcementModal');
    const closeBtn = document.getElementById('closeAnnouncementModal');
    const cancelBtn = document.getElementById('cancelAnnouncementBtn');
    const form = document.getElementById('announcementForm');
    const audienceSelect = document.getElementById('announcementAudience');
    const classGroup = document.getElementById('targetClassGroup');
    const studentGroup = document.getElementById('targetStudentGroup');

    if (!modal) return;

    const openTrigger = () => {
        if (form) form.reset();
        const msgEl = document.getElementById('announcementFormMessage');
        if (msgEl) {
            msgEl.textContent = '';
            msgEl.className = 'form-message';
        }
        if (classGroup) classGroup.classList.add('hidden');
        if (studentGroup) studentGroup.classList.add('hidden');
        modal.classList.remove('hidden');
        loadAudienceDropdownData();
    };

    if (openBtn) openBtn.addEventListener('click', openTrigger);
    const welcomeBtn = document.getElementById('welcomeComposeBtn');
    if (welcomeBtn) welcomeBtn.addEventListener('click', openTrigger);
    const quickBtn = document.getElementById('quickActionAnnouncementBtn');
    if (quickBtn) quickBtn.addEventListener('click', openTrigger);

    if (window.location.hash === '#compose') {
        setTimeout(openTrigger, 300);
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // Toggle target audience selectors
    if (audienceSelect) {
        audienceSelect.addEventListener('change', function () {
            const val = this.value;
            if (val === 'class') {
                if (classGroup) classGroup.classList.remove('hidden');
                if (studentGroup) studentGroup.classList.add('hidden');
                document.getElementById('targetClassSelect')?.setAttribute('required', 'required');
                document.getElementById('targetStudentSelect')?.removeAttribute('required');
            } else if (val === 'student') {
                if (classGroup) classGroup.classList.add('hidden');
                if (studentGroup) studentGroup.classList.remove('hidden');
                document.getElementById('targetStudentSelect')?.setAttribute('required', 'required');
                document.getElementById('targetClassSelect')?.removeAttribute('required');
            } else {
                if (classGroup) classGroup.classList.add('hidden');
                if (studentGroup) studentGroup.classList.add('hidden');
                document.getElementById('targetClassSelect')?.removeAttribute('required');
                document.getElementById('targetStudentSelect')?.removeAttribute('required');
            }
        });
    }

    // Submit Announcement
    if (form) {
        form.addEventListener('submit', handleAnnouncementSubmit);
    }
}

async function loadAudienceDropdownData() {
    const classSelect = document.getElementById('targetClassSelect');
    const studentSelect = document.getElementById('targetStudentSelect');

    // 1. Classes
    if (classSelect && cachedDashboardClasses.length === 0) {
        let classes = [];
        if (window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient
                    .from('classes')
                    .select('class_code, section, department, year')
                    .order('class_code');
                if (data && data.length > 0) classes = data;
            } catch (e) {}
        }
        if (classes.length === 0) {
            const stored = localStorage.getItem('classList');
            classes = stored ? JSON.parse(stored) : getDefaultClasses();
        }
        cachedDashboardClasses = classes;

        classSelect.innerHTML = '<option value="">-- Choose Class --</option>';
        classes.forEach(c => {
            const opt = document.createElement('option');
            const code = c.class_code || c.code;
            opt.value = code;
            opt.textContent = `${code} (${c.department} - ${c.year || 'Class'})`;
            classSelect.appendChild(opt);
        });
    }

    // 2. Students
    if (studentSelect && cachedDashboardStudents.length === 0) {
        let students = [];
        if (window.supabaseClient) {
            try {
                const { data } = await window.supabaseClient
                    .from('students')
                    .select('id, roll_number, name, department, year, section')
                    .order('roll_number');
                if (data && data.length > 0) students = data;
            } catch (e) {}
        }
        if (students.length === 0) {
            students = getStudentsList();
        }
        cachedDashboardStudents = students;

        studentSelect.innerHTML = '<option value="">-- Choose Student --</option>';
        students.forEach(s => {
            const opt = document.createElement('option');
            const roll = s.roll_number || s.rollNo;
            opt.value = s.id || roll;
            opt.dataset.roll = roll;
            opt.dataset.name = s.name;
            opt.textContent = `${roll} - ${s.name} (${s.department || 'CSE'})`;
            studentSelect.appendChild(opt);
        });
    }
}

async function handleAnnouncementSubmit(e) {
    e.preventDefault();

    const audience = document.getElementById('announcementAudience').value;
    const type = document.getElementById('announcementType').value;
    const title = document.getElementById('announcementTitle').value.trim();
    const message = document.getElementById('announcementMessage').value.trim();
    const classVal = document.getElementById('targetClassSelect')?.value || null;
    const studentVal = document.getElementById('targetStudentSelect')?.value || null;
    const messageEl = document.getElementById('announcementFormMessage');
    const submitBtn = document.getElementById('sendAnnouncementBtn');

    if (!title || !message) {
        if (messageEl) {
            messageEl.textContent = '❌ Please enter both title and message.';
            messageEl.className = 'form-message error';
        }
        return;
    }

    if (audience === 'class' && !classVal) {
        if (messageEl) {
            messageEl.textContent = '❌ Please select a specific class.';
            messageEl.className = 'form-message error';
        }
        return;
    }

    if (audience === 'student' && !studentVal) {
        if (messageEl) {
            messageEl.textContent = '❌ Please select a specific student.';
            messageEl.className = 'form-message error';
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🚀 Dispatching to Supabase...';
    }

    let announcementId = null;
    let deliveredCount = 0;

    // 1. Insert master record into public.announcements in Supabase
    if (window.supabaseClient) {
        try {
            const { data: annData, error: annError } = await window.supabaseClient
                .from('announcements')
                .insert([{
                    title,
                    content: message,
                    type,
                    target_audience: audience,
                    target_class: audience === 'class' ? classVal : null,
                    target_student_id: (audience === 'student' && studentVal.includes('-')) ? studentVal : null,
                    target_role: 'student',
                    sender_name: 'Administrator'
                }])
                .select('id')
                .single();

            if (!annError && annData) {
                announcementId = annData.id;
            } else if (annError) {
                console.warn('[AdminDashboard] announcements insert warning:', annError);
            }
        } catch (err) {
            console.warn('[AdminDashboard] announcements insert error:', err);
        }

        // 2. Fetch target students from Supabase and insert individual notification records
        try {
            let targetStudents = [];

            if (audience === 'student') {
                // Single student
                let studentDbId = studentVal;
                if (!studentVal.includes('-')) {
                    const { data: st } = await window.supabaseClient
                        .from('students')
                        .select('id, roll_number')
                        .or(`roll_number.eq.${studentVal},id.eq.${studentVal}`)
                        .maybeSingle();
                    if (st) studentDbId = st.id;
                }
                targetStudents = [{ id: studentDbId }];
            } else if (audience === 'class') {
                // Class filter: e.g. 'CSE-A' -> department='CSE', section='A'
                const parts = classVal.split('-');
                let query = window.supabaseClient.from('students').select('id, roll_number, department, section');
                if (parts.length === 2) {
                    query = query.eq('department', parts[0]).eq('section', parts[1]);
                } else {
                    query = query.eq('department', classVal);
                }
                const { data: classStudents } = await query;
                if (classStudents && classStudents.length > 0) {
                    targetStudents = classStudents;
                }
            } else {
                // All students
                const { data: allStudents } = await window.supabaseClient
                    .from('students')
                    .select('id, roll_number');
                if (allStudents && allStudents.length > 0) {
                    targetStudents = allStudents;
                }
            }

            // Bulk insert individual student notification records
            if (targetStudents.length > 0) {
                const notificationsToInsert = targetStudents.map(st => ({
                    student_id: st.id,
                    title,
                    message,
                    type,
                    target_role: 'student',
                    target_class: audience === 'class' ? classVal : null,
                    announcement_id: announcementId,
                    sender_name: 'Administrator',
                    is_read: false
                }));

                for (let i = 0; i < notificationsToInsert.length; i += 50) {
                    const batch = notificationsToInsert.slice(i, i + 50);
                    const { error: notifErr } = await window.supabaseClient
                        .from('notifications')
                        .insert(batch);
                    if (!notifErr) {
                        deliveredCount += batch.length;
                    }
                }
            } else {
                // Fallback broadcast notification row with null student_id
                await window.supabaseClient
                    .from('notifications')
                    .insert([{
                        title,
                        message,
                        type,
                        target_role: 'student',
                        target_class: audience === 'class' ? classVal : null,
                        announcement_id: announcementId,
                        sender_name: 'Administrator',
                        is_read: false
                    }]);
                deliveredCount = 1;
            }
        } catch (notifException) {
            console.warn('[AdminDashboard] notifications delivery error:', notifException);
        }
    }

    // Feedback message
    if (messageEl) {
        const countText = deliveredCount > 0 ? `delivered to ${deliveredCount} student account(s)` : 'broadcasted';
        messageEl.textContent = `✅ Announcement successfully stored in Supabase & ${countText}!`;
        messageEl.className = 'form-message success';
    }

    // Refresh recent announcements feed
    loadRecentAnnouncements();

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Dispatch Announcement';
        }
        document.getElementById('announcementModal')?.classList.add('hidden');
    }, 1200);
}

// Load and Render Recent Announcements Feed
async function loadRecentAnnouncements() {
    const feedEl = document.getElementById('announcementsFeed');
    if (!feedEl) return;

    let announcements = [];

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);

            if (!error && data && data.length > 0) {
                announcements = data;
            }
        } catch (e) {}
    }

    if (announcements.length === 0) {
        feedEl.innerHTML = `
            <div class="announcement-empty">
                <span>🔕</span>
                <p>No announcements broadcasted yet. Click "Compose Announcement" above to send one.</p>
            </div>
        `;
        return;
    }

    feedEl.innerHTML = announcements.map(ann => {
        let audienceLabel = '👥 All Students';
        let pillClass = '';
        if (ann.target_audience === 'class') {
            audienceLabel = `🏫 Class: ${ann.target_class || 'Specific'}`;
            pillClass = 'class-pill';
        } else if (ann.target_audience === 'student') {
            audienceLabel = '👤 Specific Student';
            pillClass = 'student-pill';
        }

        const typeClass = ann.type ? `type-${ann.type}` : '';
        const timeAgo = formatRelativeTime(ann.created_at);

        return `
            <div class="announcement-item-card ${typeClass}">
                <div class="announcement-item-content">
                    <h4 class="announcement-item-title">${escapeDashboardHtml(ann.title)}</h4>
                    <p class="announcement-item-msg">${escapeDashboardHtml(ann.content)}</p>
                    <div class="announcement-item-meta">
                        <span class="audience-pill ${pillClass}">${audienceLabel}</span>
                        <span>⏰ ${timeAgo}</span>
                        <span>👑 ${ann.sender_name || 'Administrator'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeDashboardHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

