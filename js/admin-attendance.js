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
// POPULATE DROPDOWNS & DATE
// ==========================================

function initializeSelectors() {

    const dateInput = document.getElementById('attendanceDate');
    const classSelect = document.getElementById('classSelect');
    const subjectSelect = document.getElementById('subjectSelect');

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load classes
    const classes = JSON.parse(localStorage.getItem('classList')) || [
        { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year', strength: 60 },
        { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year', strength: 62 },
        { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year', strength: 58 },
        { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year', strength: 55 },
        { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year', strength: 52 }
    ];

    classSelect.innerHTML = '<option value="">-- Select Class --</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.code} (${c.department} - ${c.year})`;
        opt.setAttribute('data-dept', c.department);
        opt.setAttribute('data-year', c.year);
        classSelect.appendChild(opt);
    });

    // Load subjects
    const subjects = JSON.parse(localStorage.getItem('subjectList')) || [
        { code: 'CS401', name: 'Web Technologies', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS402', name: 'Computer Networks', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS403', name: 'Machine Learning', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS404', name: 'Cloud Computing', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS405', name: 'Software Engineering', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS406', name: 'Database Management', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS407', name: 'Operating Systems', department: 'CSE', semester: '7th Semester', credits: 4 },
        { code: 'CS408', name: 'Cryptography', department: 'CSE', semester: '7th Semester', credits: 4 }
    ];

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
// GET ALL STUDENTS
// ==========================================

function getAllStudents() {

    const stored = localStorage.getItem('adminStudentsList');
    if (stored) {
        return JSON.parse(stored);
    }

    // Default student list
    const defaults = [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0505", name: "AYYAPPA REDDY YAMINI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0506", name: "BANAGANI SREENATH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0507", name: "BANALA MADHU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0508", name: "BANAVATH MANTHESH NAIK", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0509", name: "BANDARU VASUDHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0510", name: "BANDI BHARGAVI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0511", name: "BANDI KIRAN KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0512", name: "BARIKI RAJU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0513", name: "BATTA VENU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0514", name: "BHOGAM MANOHAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0515", name: "BOGGARAPU NANDINI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0516", name: "BOGYAM PRAVEEN KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0517", name: "BOYA GOPAL", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0518", name: "BOYA VINOD", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0519", name: "BALGADEE JAGANMOHAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0520", name: "TARUN SAYIRAM", department: "CSE", year: "4th Year" }
    ];

    return defaults;

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
// LOAD STUDENTS
// ==========================================

function loadStudentsForAttendance() {

    const date = document.getElementById('attendanceDate').value;
    const classCode = document.getElementById('classSelect').value;
    const subjectCode = document.getElementById('subjectSelect').value;
    const attendanceSection = document.getElementById('attendanceSection');

    if (!date || !classCode || !subjectCode) {
        alert('⚠️ Please select Date, Class, and Subject.');
        return;
    }

    const allStudents = getAllStudents();
    const classSelect = document.getElementById('classSelect');
    const selectedOption = classSelect.options[classSelect.selectedIndex];
    const dept = selectedOption.getAttribute('data-dept');

    // Filter students by department if applicable, or include all
    currentStudents = allStudents.filter(s => !dept || s.department === dept || s.department === 'CSE');
    if (currentStudents.length === 0) {
        currentStudents = allStudents;
    }

    // Check if attendance already exists for this date, class, and subject
    const existingKey = `attendance_${classCode}_${subjectCode}_${date}`;
    const existingData = localStorage.getItem(existingKey);

    currentAttendance = {};

    if (existingData) {
        const parsed = JSON.parse(existingData);
        currentAttendance = parsed.students || {};
    }

    // Default missing student statuses to 'present'
    currentStudents.forEach(s => {
        if (!currentAttendance[s.rollNo]) {
            currentAttendance[s.rollNo] = 'present';
        }
    });

    renderAttendanceList();
    updateAttendanceStats();
    attendanceSection.classList.remove('hidden');

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
// SAVE ATTENDANCE
// ==========================================

function saveAttendance() {

    const date = document.getElementById('attendanceDate').value;
    const classCode = document.getElementById('classSelect').value;
    const subjectSelect = document.getElementById('subjectSelect');
    const subjectCode = subjectSelect.value;
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.getAttribute('data-name') || subjectCode;
    const messageEl = document.getElementById('statusMessage');

    if (!date || !classCode || !subjectCode) {
        messageEl.textContent = '❌ Missing date, class or subject!';
        messageEl.className = 'form-message error';
        return;
    }

    const payload = {
        id: `att_${Date.now()}`,
        date: date,
        classCode: classCode,
        subjectCode: subjectCode,
        subjectName: subjectName,
        students: currentAttendance,
        updatedAt: new Date().toISOString()
    };

    // Save individual session
    const key = `attendance_${classCode}_${subjectCode}_${date}`;
    localStorage.setItem(key, JSON.stringify(payload));

    // Also update attendance master list
    let records = JSON.parse(localStorage.getItem('attendance_records')) || [];
    records = records.filter(r => !(r.date === date && r.classCode === classCode && r.subjectCode === subjectCode));
    records.push(payload);
    localStorage.setItem('attendance_records', JSON.stringify(records));

    messageEl.textContent = `✅ Attendance saved successfully for ${currentStudents.length} students on ${date}!`;
    messageEl.className = 'form-message success';

    setTimeout(() => {
        messageEl.textContent = '';
    }, 3500);

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
