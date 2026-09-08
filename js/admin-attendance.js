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

    initializeAttendancePage();

});


// ==========================================
// STATE VARIABLES
// ==========================================

let currentStudents = [];
let currentAttendance = {}; // rollNo -> 'present' | 'absent'
let cachedClasses = [];
let cachedSubjects = [];


// ==========================================
// INITIALIZE ATTENDANCE PAGE
// ==========================================

function initializeAttendancePage() {

    setupMenuButton();
    setupLogoutButton();
    initializeSelectors();
    setupActionButtons();

}


// ==========================================
// POPULATE DROPDOWNS & DATE (SUPABASE + FALLBACK)
// ==========================================

async function initializeSelectors() {

    const dateInput = document.getElementById('attendanceDate');
    const classSelect = document.getElementById('classSelect');
    const subjectSelect = document.getElementById('subjectSelect');

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Default classes
    let classes = [
        { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year' },
        { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year' },
        { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year' },
        { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year' },
        { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year' }
    ];

    // Default subjects
    let subjects = [
        { code: 'CS401', name: 'Web Technologies', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS402', name: 'Computer Networks', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS403', name: 'Machine Learning', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS404', name: 'Cloud Computing', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS405', name: 'Software Engineering', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS406', name: 'Database Management', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS407', name: 'Operating Systems', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS408', name: 'Cryptography', department: 'CSE', semester: '7th Semester', credits: 4 }
    ];

    // Try Supabase first
    if (window.supabaseClient) {
        try {
            const { data: dbClasses } = await window.supabaseClient
                .from('classes')
                .select('class_code, section, department, year')
                .order('class_code');

            if (dbClasses && dbClasses.length > 0) {
                classes = dbClasses.map(c => ({
                    code: c.class_code,
                    section: c.section,
                    department: c.department,
                    year: c.year
                }));
            }

            const { data: dbSubjects } = await window.supabaseClient
                .from('subjects')
                .select('subject_code, subject_name, department, semester, credits')
                .order('subject_code');

            if (dbSubjects && dbSubjects.length > 0) {
                subjects = dbSubjects.map(s => ({
                    code: s.subject_code,
                    name: s.subject_name,
                    department: s.department,
                    semester: s.semester,
                    credits: s.credits
                }));
            }
        } catch (sbErr) {
            console.warn('[Attendance] Supabase selector load error, using local fallback:', sbErr);
        }
    }

    cachedClasses = classes;
    cachedSubjects = subjects;

    // Populate class dropdown
    classSelect.innerHTML = '<option value="">-- Select Class --</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.code} (${c.department} - ${c.year})`;
        opt.setAttribute('data-dept', c.department);
        opt.setAttribute('data-year', c.year);
        classSelect.appendChild(opt);
    });

    // Populate subject dropdown
    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.code;
        opt.textContent = `${s.code} - ${s.name}`;
        opt.setAttribute('data-name', s.name);
        subjectSelect.appendChild(opt);
    });

}


// ==========================================
// GET ALL STUDENTS (SUPABASE + FALLBACK)
// ==========================================

async function getAllStudents() {

    // 1. Try Supabase first
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('students')
                .select('id, roll_number, name, department, year')
                .order('roll_number', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                return data.map(s => ({
                    id: s.id,
                    rollNo: s.roll_number,
                    name: s.name || s.roll_number,
                    department: s.department || 'CSE',
                    year: s.year || '4th Year'
                }));
            }
        } catch (sbErr) {
            console.warn('[Attendance] Supabase students fetch warning:', sbErr);
        }
    }

    // 2. Fallback to localStorage
    const stored = localStorage.getItem('adminStudentsList');
    if (stored) {
        return JSON.parse(stored);
    }

    // 3. Fallback defaults
    return [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0505", name: "AYYAPPA REDDY YAMINI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0506", name: "BANAGANI SREENATH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0507", name: "BANALA MADHU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0508", name: "BANAVATH MANTHESH NAIK", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0509", name: "BANDARU VASUDHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0510", name: "BANDI BHARGAVI", department: "CSE", year: "4th Year" }
    ];

}


// ==========================================
// ACTION BUTTONS HANDLER
// ==========================================

function setupActionButtons() {

    const loadBtn = document.getElementById('loadStudentsBtn');
    const resetBtn = document.getElementById('resetFormBtn');
    const markAllPresentBtn = document.getElementById('markAllPresentBtn');
    const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
    const saveBtn = document.getElementById('saveAttendanceBtn');

    loadBtn.addEventListener('click', loadStudentsForAttendance);
    resetBtn.addEventListener('click', resetSelectionForm);
    markAllPresentBtn.addEventListener('click', markAllPresent);
    markAllAbsentBtn.addEventListener('click', markAllAbsent);
    saveBtn.addEventListener('click', saveAttendance);

}


// ==========================================
// LOAD STUDENTS FOR ATTENDANCE
// ==========================================

async function loadStudentsForAttendance() {

    const date = document.getElementById('attendanceDate').value;
    const classCode = document.getElementById('classSelect').value;
    const subjectCode = document.getElementById('subjectSelect').value;
    const attendanceSection = document.getElementById('attendanceSection');
    const loadBtn = document.getElementById('loadStudentsBtn');

    if (!date || !classCode || !subjectCode) {
        alert('⚠️ Please select Date, Class, and Subject.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';

    const allStudents = await getAllStudents();
    const classSelect = document.getElementById('classSelect');
    const selectedOption = classSelect.options[classSelect.selectedIndex];
    const dept = selectedOption.getAttribute('data-dept');

    // Filter students by department if applicable
    currentStudents = allStudents.filter(s => !dept || s.department === dept || s.department === 'CSE');
    if (currentStudents.length === 0) {
        currentStudents = allStudents;
    }

    currentAttendance = {};

    // 1. Check if attendance already exists in Supabase
    let loadedFromDb = false;
    if (window.supabaseClient) {
        try {
            const { data: sessionData, error } = await window.supabaseClient
                .from('attendance_sessions')
                .select(`
                    id,
                    attendance_records (
                        status,
                        student_id,
                        students (
                            roll_number
                        )
                    )
                `)
                .eq('date', date)
                .maybeSingle();

            if (!error && sessionData && Array.isArray(sessionData.attendance_records) && sessionData.attendance_records.length > 0) {
                sessionData.attendance_records.forEach(r => {
                    const rNo = r.students?.roll_number;
                    if (rNo) {
                        currentAttendance[rNo] = r.status || 'present';
                    }
                });
                loadedFromDb = Object.keys(currentAttendance).length > 0;
            }
        } catch (sbErr) {
            console.warn('[Attendance] Supabase existing attendance check warning:', sbErr);
        }
    }

    // 2. Fallback check: localStorage
    if (!loadedFromDb) {
        const existingKey = `attendance_${classCode}_${subjectCode}_${date}`;
        const existingData = localStorage.getItem(existingKey);
        if (existingData) {
            try {
                const parsed = JSON.parse(existingData);
                currentAttendance = parsed.students || {};
            } catch (e) {}
        }
    }

    // Default any remaining unassigned student to 'present'
    currentStudents.forEach(s => {
        if (!currentAttendance[s.rollNo]) {
            currentAttendance[s.rollNo] = 'present';
        }
    });

    renderAttendanceList();
    updateAttendanceStats();
    attendanceSection.classList.remove('hidden');

    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Students';

}


// ==========================================
// RENDER ATTENDANCE LIST
// ==========================================

function renderAttendanceList() {

    const container = document.getElementById('attendanceList');
    container.innerHTML = '';

    currentStudents.forEach((student, index) => {
        const status = currentAttendance[student.rollNo] || 'present';
        const isPresent = status === 'present';

        const item = document.createElement('div');
        item.className = `attendance-item ${status}`;
        item.id = `att_item_${student.rollNo}`;

        item.innerHTML = `
            <div class="student-info-mini">
                <span class="student-index">${index + 1}.</span>
                <div>
                    <strong>${student.name}</strong>
                    <small class="student-roll">${student.rollNo}</small>
                </div>
            </div>
            <div class="attendance-toggle-btns">
                <button type="button" class="btn-toggle present-btn ${isPresent ? 'active' : ''}" onclick="toggleStatus('${student.rollNo}', 'present')">
                    ✓ Present
                </button>
                <button type="button" class="btn-toggle absent-btn ${!isPresent ? 'active' : ''}" onclick="toggleStatus('${student.rollNo}', 'absent')">
                    ✗ Absent
                </button>
            </div>
        `;

        container.appendChild(item);
    });

}


// ==========================================
// TOGGLE INDIVIDUAL STATUS
// ==========================================

window.toggleStatus = function (rollNo, status) {

    currentAttendance[rollNo] = status;

    const item = document.getElementById(`att_item_${rollNo}`);
    if (item) {
        item.className = `attendance-item ${status}`;
        const presentBtn = item.querySelector('.present-btn');
        const absentBtn = item.querySelector('.absent-btn');

        if (status === 'present') {
            presentBtn.classList.add('active');
            absentBtn.classList.remove('active');
        } else {
            presentBtn.classList.remove('active');
            absentBtn.classList.add('active');
        }
    }

    updateAttendanceStats();

};


// ==========================================
// BATCH ACTIONS
// ==========================================

function markAllPresent() {

    currentStudents.forEach(s => {
        currentAttendance[s.rollNo] = 'present';
    });

    renderAttendanceList();
    updateAttendanceStats();

}

function markAllAbsent() {

    currentStudents.forEach(s => {
        currentAttendance[s.rollNo] = 'absent';
    });

    renderAttendanceList();
    updateAttendanceStats();

}


// ==========================================
// UPDATE STATS COUNTER
// ==========================================

function updateAttendanceStats() {

    let present = 0;
    let absent = 0;
    const total = currentStudents.length;

    currentStudents.forEach(s => {
        if (currentAttendance[s.rollNo] === 'present') {
            present++;
        } else {
            absent++;
        }
    });

    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('totalCount').textContent = total;

}


// ==========================================
// SAVE ATTENDANCE (SUPABASE + FALLBACK)
// ==========================================

async function saveAttendance() {

    const date = document.getElementById('attendanceDate').value;
    const classCode = document.getElementById('classSelect').value;
    const subjectSelect = document.getElementById('subjectSelect');
    const subjectCode = subjectSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.getAttribute('data-name') || subjectCode;
    const messageEl = document.getElementById('statusMessage');
    const saveBtn = document.getElementById('saveAttendanceBtn');

    if (!date || !classCode || !subjectCode) {
        messageEl.textContent = '❌ Missing date, class or subject!';
        messageEl.className = 'form-message error';
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const payload = {
        id: `att_${Date.now()}`,
        date: date,
        classCode: classCode,
        subjectCode: subjectCode,
        subjectName: subjectName,
        students: currentAttendance,
        updatedAt: new Date().toISOString()
    };

    let supabaseSuccess = false;

    // 1. Save to Supabase
    if (window.supabaseClient) {
        try {
            // First try atomic RPC
            const { data: rpcData, error: rpcErr } = await window.supabaseClient.rpc('save_attendance_batch', {
                p_class_code: classCode,
                p_subject_code: subjectCode,
                p_date: date,
                p_records: currentAttendance
            });

            if (!rpcErr && rpcData && rpcData.success) {
                supabaseSuccess = true;
            } else {
                console.warn('[Attendance] RPC error, falling back to direct table inserts:', rpcErr);

                // Direct fallback: Get or create session
                let classId = null;
                let subjectId = null;

                const { data: cRow } = await window.supabaseClient
                    .from('classes')
                    .select('id')
                    .eq('class_code', classCode)
                    .maybeSingle();
                classId = cRow?.id;

                const { data: sRow } = await window.supabaseClient
                    .from('subjects')
                    .select('id')
                    .eq('subject_code', subjectCode)
                    .maybeSingle();
                subjectId = sRow?.id;

                if (classId && subjectId) {
                    const { data: sess, error: sessErr } = await window.supabaseClient
                        .from('attendance_sessions')
                        .upsert({
                            class_id: classId,
                            subject_id: subjectId,
                            date: date,
                            marked_by: (await window.supabaseClient.auth.getUser()).data.user?.id
                        }, { onConflict: 'class_id,subject_id,date' })
                        .select('id')
                        .single();

                    if (!sessErr && sess) {
                        supabaseSuccess = true;
                    }
                }
            }
        } catch (sbErr) {
            console.warn('[Attendance] Supabase save warning:', sbErr);
        }
    }

    // 2. Save individual session to localStorage
    const key = `attendance_${classCode}_${subjectCode}_${date}`;
    localStorage.setItem(key, JSON.stringify(payload));

    // 3. Update attendance master list in localStorage
    let records = JSON.parse(localStorage.getItem('attendance_records')) || [];
    records = records.filter(r => !(r.date === date && r.classCode === classCode && r.subjectCode === subjectCode));
    records.push(payload);
    localStorage.setItem('attendance_records', JSON.stringify(records));

    const destination = supabaseSuccess ? 'Supabase & Local Cache' : 'Local Cache';
    messageEl.textContent = `✅ Attendance saved to ${destination} for ${currentStudents.length} students on ${date}!`;
    messageEl.className = 'form-message success';

    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Attendance';

    setTimeout(() => {
        messageEl.textContent = '';
    }, 4000);

}


// ==========================================
// RESET SELECTION FORM
// ==========================================

function resetSelectionForm() {

    document.getElementById('classSelect').value = '';
    document.getElementById('subjectSelect').value = '';
    document.getElementById('attendanceSection').classList.add('hidden');
    document.getElementById('statusMessage').textContent = '';
    currentStudents = [];
    currentAttendance = {};

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
