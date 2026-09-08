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

    initializeTimetablePage();

});


// ==========================================
// STATE
// ==========================================

let currentClass = 'CSE-A';


// ==========================================
// INITIALIZE TIMETABLE PAGE
// ==========================================

function initializeTimetablePage() {

    setupMenuButton();
    setupLogoutButton();
    populateClassSelector();
    populateModalDropdowns();
    setupModal();
    renderTimetable();

}


// ==========================================
// POPULATE CLASS SELECTOR
// ==========================================

function populateClassSelector() {

    const classSelect = document.getElementById('classSelect');
    const classes = JSON.parse(localStorage.getItem('classList')) || [
        { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year' },
        { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year' },
        { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year' },
        { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year' },
        { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year' }
    ];

    classSelect.innerHTML = '';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.code} (${c.department} - ${c.year})`;
        if (c.code === currentClass) opt.selected = true;
        classSelect.appendChild(opt);
    });

    classSelect.addEventListener('change', function () {
        currentClass = this.value;
        renderTimetable();
    });

}


// ==========================================
// POPULATE MODAL DROPDOWNS
// ==========================================

function populateModalDropdowns() {

    const subjectSelect = document.getElementById('slotSubject');
    const facultySelect = document.getElementById('slotFaculty');

    const subjects = JSON.parse(localStorage.getItem('subjectList')) || [
        { code: 'CS401', name: 'Web Technologies' },
        { code: 'CS402', name: 'Computer Networks' },
        { code: 'CS403', name: 'Machine Learning' },
        { code: 'CS404', name: 'Cloud Computing' },
        { code: 'CS405', name: 'Software Engineering' },
        { code: 'CS406', name: 'Database Management' }
    ];

    const faculty = JSON.parse(localStorage.getItem('facultyList')) || [
        { name: 'Dr. K. Srinivas', department: 'CSE' },
        { name: 'Prof. P. Lakshmi', department: 'CSE' },
        { name: 'Dr. M. Venkata Rao', department: 'CSE' },
        { name: 'Prof. S. Raghunath', department: 'ECE' }
    ];

    subjectSelect.innerHTML = '';
    subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.code} - ${s.name}`;
        subjectSelect.appendChild(opt);
    });

    facultySelect.innerHTML = '';
    faculty.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = `${f.name} (${f.department})`;
        facultySelect.appendChild(opt);
    });

}


// ==========================================
// DEFAULT TIMETABLE DATA
// ==========================================

function getDefaultTimetable() {

    return {
        'CSE-A': [
            { id: 1, day: 'Monday', period: '09:00 - 10:00 AM', subject: 'Web Technologies', faculty: 'Dr. K. Srinivas', room: 'Room 401' },
            { id: 2, day: 'Monday', period: '10:00 - 11:00 AM', subject: 'Computer Networks', faculty: 'Prof. P. Lakshmi', room: 'Room 401' },
            { id: 3, day: 'Monday', period: '11:15 - 12:15 PM', subject: 'Machine Learning', faculty: 'Dr. M. Venkata Rao', room: 'Room 401' },
            { id: 4, day: 'Tuesday', period: '09:00 - 10:00 AM', subject: 'Cloud Computing', faculty: 'Dr. K. Srinivas', room: 'Lab 2' },
            { id: 5, day: 'Tuesday', period: '10:00 - 11:00 AM', subject: 'Software Engineering', faculty: 'Prof. P. Lakshmi', room: 'Room 401' },
            { id: 6, day: 'Wednesday', period: '09:00 - 10:00 AM', subject: 'Web Technologies', faculty: 'Dr. K. Srinivas', room: 'Room 401' },
            { id: 7, day: 'Wednesday', period: '10:00 - 11:00 AM', subject: 'Database Management', faculty: 'Dr. M. Venkata Rao', room: 'Lab 1' },
            { id: 8, day: 'Thursday', period: '09:00 - 10:00 AM', subject: 'Machine Learning', faculty: 'Dr. M. Venkata Rao', room: 'Room 401' },
            { id: 9, day: 'Friday', period: '09:00 - 10:00 AM', subject: 'Computer Networks', faculty: 'Prof. P. Lakshmi', room: 'Room 401' }
        ]
    };

}

function getTimetableData() {

    const stored = localStorage.getItem('timetableData');
    if (stored) return JSON.parse(stored);

    const defaults = getDefaultTimetable();
    localStorage.setItem('timetableData', JSON.stringify(defaults));
    return defaults;

}


// ==========================================
// RENDER TIMETABLE
// ==========================================

function renderTimetable() {

    const container = document.getElementById('timetableGrid');
    const timetable = getTimetableData();
    const slots = timetable[currentClass] || [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = '';

    days.forEach(day => {
        const daySlots = slots.filter(s => s.day === day);

        const dayCard = document.createElement('div');
        dayCard.className = 'timetable-day-card card';
        dayCard.style.marginBottom = '20px';

        let slotsHTML = '';
        if (daySlots.length === 0) {
            slotsHTML = `<p style="color: #999; font-style: italic; padding: 10px 0;">No classes scheduled.</p>`;
        } else {
            slotsHTML = daySlots.map(s => `
                <div class="timetable-slot-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(102, 126, 234, 0.06); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #667eea;">
                    <div>
                        <strong style="color: #333; display: block;">${s.subject}</strong>
                        <small style="color: #667eea; font-weight: 600;">⏰ ${s.period}</small> • 
                        <small style="color: #666;">👨‍🏫 ${s.faculty}</small> • 
                        <small style="color: #888;">📍 ${s.room}</small>
                    </div>
                    <button class="action-btn delete-btn" onclick="deleteTimeSlot(${s.id})" title="Delete Slot">🗑</button>
                </div>
            `).join('');
        }

        dayCard.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span>📅 ${day}</span>
                <span class="badge">${daySlots.length} Classes</span>
            </div>
            <div class="card-body" style="padding: 15px;">
                ${slotsHTML}
            </div>
        `;

        container.appendChild(dayCard);
    });

}


// ==========================================
// MODAL SETUP & SUBMIT
// ==========================================

function setupModal() {

    const addBtn = document.getElementById('addTimeSlotBtn');
    const modal = document.getElementById('timeSlotModal');
    const closeBtn = document.getElementById('closeTimeSlotModal');
    const cancelBtn = document.getElementById('cancelSlotBtn');
    const form = document.getElementById('timeSlotForm');

    if (!modal) return;

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('slotFormMessage').textContent = '';
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const day = document.getElementById('slotDay').value;
        const period = document.getElementById('slotPeriod').value;
        const subject = document.getElementById('slotSubject').value;
        const faculty = document.getElementById('slotFaculty').value;
        const room = document.getElementById('slotRoom').value.trim();
        const messageEl = document.getElementById('slotFormMessage');

        const timetable = getTimetableData();
        if (!timetable[currentClass]) {
            timetable[currentClass] = [];
        }

        const newSlot = {
            id: Date.now(),
            day,
            period,
            subject,
            faculty,
            room
        };

        timetable[currentClass].push(newSlot);
        localStorage.setItem('timetableData', JSON.stringify(timetable));

        messageEl.textContent = '✅ Time slot added successfully!';
        messageEl.className = 'form-message success';

        setTimeout(() => {
            modal.classList.add('hidden');
            renderTimetable();
        }, 1000);
    });

}

window.deleteTimeSlot = function (id) {

    if (!confirm('❓ Are you sure you want to delete this time slot?')) return;

    const timetable = getTimetableData();
    if (timetable[currentClass]) {
        timetable[currentClass] = timetable[currentClass].filter(s => s.id !== id);
        localStorage.setItem('timetableData', JSON.stringify(timetable));
        renderTimetable();
    }

};


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
