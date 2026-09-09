// ==============================================================================
// ADMIN TIMETABLE MANAGEMENT (PHASE 8)
// ==============================================================================
// Fully integrated with Supabase 'timetables', 'classes', 'subjects', and 'faculty'
// tables, featuring Realtime schedule sync, dynamic dropdowns, and local fallback.
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

    initializeTimetablePage();
});


// State
let currentClass = 'CSE-A';
let timetableDataCache = {};
let availableClassesCache = [];
let availableSubjectsCache = [];
let availableFacultyCache = [];
let realtimeChannel = null;


// Initialize Timetable Page
async function initializeTimetablePage() {
    setupMenuButton();
    setupLogoutButton();
    setupModal();
    setupRealtimeTimetable();

    // 1. Load classes, subjects, and faculty for dropdowns
    await loadDropdownData();

    // 2. Load timetable slots
    await loadTimetableData();
}


// ==============================================================================
// SUPABASE REALTIME SUBSCRIPTION
// ==============================================================================

function setupRealtimeTimetable() {
    if (!window.supabaseClient) return;

    try {
        if (realtimeChannel) {
            window.supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = window.supabaseClient
            .channel('public:timetables')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'timetables' },
                () => {
                    console.log('[AdminTimetable] Realtime update received, refreshing grid...');
                    loadTimetableData(true);
                }
            )
            .subscribe();
    } catch (err) {
        console.warn('[AdminTimetable] Realtime subscription error:', err);
    }
}


// ==============================================================================
// LOAD DROPDOWN DATA (CLASSES, SUBJECTS, FACULTY)
// ==============================================================================

async function loadDropdownData() {
    // Classes
    let classes = [];
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('classes')
                .select('class_code, section, department, year')
                .order('class_code');
            if (data && data.length > 0) {
                classes = data.map(c => ({
                    code: c.class_code,
                    section: c.section,
                    department: c.department,
                    year: c.year
                }));
            }
        } catch (e) {}
    }
    if (classes.length === 0) {
        const stored = localStorage.getItem('classList');
        classes = stored ? JSON.parse(stored) : [
            { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year' },
            { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year' },
            { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year' },
            { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year' },
            { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year' }
        ];
    }
    availableClassesCache = classes;
    populateClassSelector();

    // Subjects
    let subjects = [];
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('subjects')
                .select('subject_code, subject_name, department')
                .order('subject_code');
            if (data && data.length > 0) {
                subjects = data.map(s => ({
                    code: s.subject_code,
                    name: s.subject_name,
                    department: s.department
                }));
            }
        } catch (e) {}
    }
    if (subjects.length === 0) {
        const stored = localStorage.getItem('subjectList');
        subjects = stored ? JSON.parse(stored) : [
            { code: 'CS401', name: 'Web Technologies' },
            { code: 'CS402', name: 'Computer Networks' },
            { code: 'CS403', name: 'Machine Learning' },
            { code: 'CS404', name: 'Cloud Computing' },
            { code: 'CS405', name: 'Software Engineering' },
            { code: 'CS406', name: 'Database Management Systems' }
        ];
    }
    availableSubjectsCache = subjects;

    // Faculty
    let faculty = [];
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('faculty')
                .select('faculty_id, name, department')
                .order('faculty_id');
            if (data && data.length > 0) {
                faculty = data.map(f => ({
                    id: f.faculty_id,
                    name: f.name,
                    department: f.department
                }));
            }
        } catch (e) {}
    }
    if (faculty.length === 0) {
        const stored = localStorage.getItem('facultyList');
        faculty = stored ? JSON.parse(stored) : [
            { name: 'Dr. K. Srinivas', department: 'CSE' },
            { name: 'Prof. P. Lakshmi', department: 'CSE' },
            { name: 'Dr. M. Venkata Rao', department: 'CSE' },
            { name: 'Dr. Rajesh Sharma', department: 'CSE' },
            { name: 'Prof. S. Raghunath', department: 'ECE' }
        ];
    }
    availableFacultyCache = faculty;

    populateModalDropdowns();
}


// Populate Class Selector
function populateClassSelector() {
    const classSelect = document.getElementById('classSelect');
    if (!classSelect) return;

    classSelect.innerHTML = '';
    availableClassesCache.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = `${c.code} (${c.department} - ${c.year || 'Class'})`;
        if (c.code === currentClass) opt.selected = true;
        classSelect.appendChild(opt);
    });

    classSelect.addEventListener('change', function () {
        currentClass = this.value;
        renderTimetable();
    });
}


// Populate Modal Dropdowns
function populateModalDropdowns() {
    const subjectSelect = document.getElementById('slotSubject');
    const facultySelect = document.getElementById('slotFaculty');

    if (subjectSelect) {
        subjectSelect.innerHTML = '';
        availableSubjectsCache.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = `${s.code} - ${s.name}`;
            subjectSelect.appendChild(opt);
        });
    }

    if (facultySelect) {
        facultySelect.innerHTML = '';
        availableFacultyCache.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.name;
            opt.textContent = `${f.name} (${f.department || 'Faculty'})`;
            facultySelect.appendChild(opt);
        });
    }
}


// ==============================================================================
// LOAD TIMETABLE DATA (SUPABASE + FALLBACK)
// ==============================================================================

async function loadTimetableData(silent = false) {
    let dataMap = {};
    let loadedFromDb = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('timetables')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                data.forEach(row => {
                    const cCode = row.class_code || 'CSE-A';
                    if (!dataMap[cCode]) dataMap[cCode] = [];

                    dataMap[cCode].push({
                        id: row.id,
                        dbId: row.id,
                        day: row.day_of_week,
                        period: row.period || (row.start_time && row.end_time ? `${row.start_time} - ${row.end_time}` : '09:00 - 10:00 AM'),
                        subject: row.subject_name || 'Subject',
                        faculty: row.faculty_name || 'Faculty',
                        room: row.room || 'Room 401'
                    });
                });
                loadedFromDb = true;
                localStorage.setItem('timetableData', JSON.stringify(dataMap));
            }
        } catch (sbErr) {
            console.warn('[AdminTimetable] Error loading from Supabase, using fallback:', sbErr);
        }
    }

    if (!loadedFromDb) {
        const stored = localStorage.getItem('timetableData');
        if (stored) {
            try {
                dataMap = JSON.parse(stored);
            } catch (e) {
                dataMap = getDefaultTimetable();
            }
        } else {
            dataMap = getDefaultTimetable();
            localStorage.setItem('timetableData', JSON.stringify(dataMap));
        }
    }

    timetableDataCache = dataMap;
    renderTimetable();
}


// ==============================================================================
// RENDER TIMETABLE GRID
// ==============================================================================

function renderTimetable() {
    const container = document.getElementById('timetableGrid');
    if (!container) return;

    const slots = timetableDataCache[currentClass] || [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = '';

    days.forEach(day => {
        const daySlots = slots.filter(s => s.day === day);

        const dayCard = document.createElement('div');
        dayCard.className = 'timetable-day-card card';
        dayCard.style.marginBottom = '20px';

        let slotsHTML = '';
        if (daySlots.length === 0) {
            slotsHTML = `<p style="color: #999; font-style: italic; padding: 10px 0;">No classes scheduled for ${day}.</p>`;
        } else {
            slotsHTML = daySlots.map(s => {
                const escapedId = typeof s.id === 'string' ? `'${s.id}'` : s.id;
                return `
                    <div class="timetable-slot-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(102, 126, 234, 0.06); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #667eea;">
                        <div>
                            <strong style="color: #333; display: block; font-size: 14px;">${s.subject}</strong>
                            <small style="color: #667eea; font-weight: 600;">⏰ ${s.period}</small> • 
                            <small style="color: #666;">👨‍🏫 ${s.faculty}</small> • 
                            <small style="color: #888;">📍 ${s.room}</small>
                        </div>
                        <button class="action-btn delete-btn" onclick="deleteTimeSlot(${escapedId})" title="Delete Slot">🗑</button>
                    </div>
                `;
            }).join('');
        }

        dayCard.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 12px 15px;">
                <span style="font-weight: 700; color: #333;">📅 ${day}</span>
                <span class="badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.2); font-weight: 600;">
                    ${daySlots.length} ${daySlots.length === 1 ? 'Class' : 'Classes'}
                </span>
            </div>
            <div class="card-body" style="padding: 15px;">
                ${slotsHTML}
            </div>
        `;

        container.appendChild(dayCard);
    });
}


// ==============================================================================
// MODAL SETUP & SUBMISSION
// ==============================================================================

function setupModal() {
    const addBtn = document.getElementById('addTimeSlotBtn');
    const modal = document.getElementById('timeSlotModal');
    const closeBtn = document.getElementById('closeTimeSlotModal');
    const cancelBtn = document.getElementById('cancelSlotBtn');
    const form = document.getElementById('timeSlotForm');

    if (!modal) return;

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            const msgEl = document.getElementById('slotFormMessage');
            if (msgEl) {
                msgEl.textContent = '';
                msgEl.className = 'form-message';
            }
            populateModalDropdowns();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    if (form) {
        form.addEventListener('submit', handleSlotSubmit);
    }
}

async function handleSlotSubmit(e) {
    e.preventDefault();

    const day = document.getElementById('slotDay').value;
    const period = document.getElementById('slotPeriod').value;
    const subject = document.getElementById('slotSubject').value;
    const faculty = document.getElementById('slotFaculty').value;
    const room = document.getElementById('slotRoom').value.trim();
    const messageEl = document.getElementById('slotFormMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!day || !period || !subject || !faculty || !room) {
        if (messageEl) {
            messageEl.textContent = '❌ Please fill in all required fields.';
            messageEl.className = 'form-message error';
        }
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    const payload = {
        class_code: currentClass,
        day_of_week: day,
        period,
        subject_name: subject,
        faculty_name: faculty,
        room
    };

    let newDbId = null;

    // 1. Try Supabase insert
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('timetables')
                .insert([payload])
                .select('id')
                .single();

            if (!error && data && data.id) {
                newDbId = data.id;
            } else if (error) {
                console.warn('[AdminTimetable] Supabase insert warning:', error);
            }
        } catch (sbErr) {
            console.warn('[AdminTimetable] Supabase insert exception:', sbErr);
        }
    }

    // 2. Update local cache
    if (!timetableDataCache[currentClass]) {
        timetableDataCache[currentClass] = [];
    }

    const newSlot = {
        id: newDbId || Date.now(),
        day,
        period,
        subject,
        faculty,
        room
    };

    timetableDataCache[currentClass].push(newSlot);
    localStorage.setItem('timetableData', JSON.stringify(timetableDataCache));

    if (messageEl) {
        messageEl.textContent = '✅ Time slot added successfully!';
        messageEl.className = 'form-message success';
    }

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Slot';
        }
        document.getElementById('timeSlotModal')?.classList.add('hidden');
        renderTimetable();
    }, 800);
}


// ==============================================================================
// DELETE TIME SLOT
// ==============================================================================

window.deleteTimeSlot = async function (id) {
    if (!confirm('❓ Are you sure you want to delete this time slot?')) return;

    // 1. Try Supabase delete
    if (window.supabaseClient) {
        try {
            const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (isUuid) {
                await window.supabaseClient.from('timetables').delete().eq('id', id);
            }
        } catch (sbErr) {
            console.warn('[AdminTimetable] Supabase delete warning:', sbErr);
        }
    }

    // 2. Remove from local cache
    if (timetableDataCache[currentClass]) {
        timetableDataCache[currentClass] = timetableDataCache[currentClass].filter(s => String(s.id) !== String(id));
        localStorage.setItem('timetableData', JSON.stringify(timetableDataCache));
        renderTimetable();
    }
};


// ==============================================================================
// DEFAULT TIMETABLE DATA
// ==============================================================================

function getDefaultTimetable() {
    return {
        'CSE-A': [
            { id: 1, day: 'Monday', period: '09:00 - 10:00 AM', subject: 'Web Technologies', faculty: 'Dr. K. Srinivas', room: 'Room 401' },
            { id: 2, day: 'Monday', period: '10:00 - 11:00 AM', subject: 'Computer Networks', faculty: 'Prof. P. Lakshmi', room: 'Room 401' },
            { id: 3, day: 'Monday', period: '11:15 - 12:15 PM', subject: 'Machine Learning', faculty: 'Dr. M. Venkata Rao', room: 'Room 401' },
            { id: 4, day: 'Tuesday', period: '09:00 - 10:00 AM', subject: 'Cloud Computing', faculty: 'Dr. K. Srinivas', room: 'Lab 2' },
            { id: 5, day: 'Tuesday', period: '10:00 - 11:00 AM', subject: 'Software Engineering', faculty: 'Prof. P. Lakshmi', room: 'Room 401' },
            { id: 6, day: 'Wednesday', period: '09:00 - 10:00 AM', subject: 'Web Technologies', faculty: 'Dr. K. Srinivas', room: 'Room 401' },
            { id: 7, day: 'Wednesday', period: '10:00 - 11:00 AM', subject: 'Database Management Systems', faculty: 'Dr. Rajesh Sharma', room: 'Lab 1' },
            { id: 8, day: 'Thursday', period: '09:00 - 10:00 AM', subject: 'Machine Learning', faculty: 'Dr. M. Venkata Rao', room: 'Room 401' },
            { id: 9, day: 'Friday', period: '09:00 - 10:00 AM', subject: 'Computer Networks', faculty: 'Prof. P. Lakshmi', room: 'Room 401' }
        ]
    };
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
