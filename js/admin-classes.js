// ==============================================================================
// ADMIN CLASSES & SUBJECTS MANAGEMENT (PHASE 8)
// ==============================================================================
// Fully integrated with Supabase 'classes', 'subjects', 'class_subjects', and 'faculty'
// tables, featuring Realtime auto-refresh and robust localStorage offline fallback.
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

    initializeClassesPage();
});


// State
let currentClassSubjectsCache = [];
let availableFacultyCache = [];
let realtimeChannel = null;


// Initialize Page
function initializeClassesPage() {
    setupMenuButton();
    setupLogoutButton();
    setupModalHandlers();
    setupFilterListeners();
    setupRealtimeClasses();

    // Initial data load
    loadFacultyOptions();
    loadClassSubjects();
}


// ==============================================================================
// SUPABASE REALTIME SUBSCRIPTION
// ==============================================================================

function setupRealtimeClasses() {
    if (!window.supabaseClient) return;

    try {
        if (realtimeChannel) {
            window.supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = window.supabaseClient
            .channel('public:class_subjects')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'class_subjects' },
                () => {
                    console.log('[AdminClasses] Realtime update received, refreshing table...');
                    loadClassSubjects(true);
                }
            )
            .subscribe();
    } catch (err) {
        console.warn('[AdminClasses] Realtime subscription error:', err);
    }
}


// ==============================================================================
// LOAD CLASS & SUBJECT DATA (SUPABASE + FALLBACK)
// ==============================================================================

async function loadClassSubjects(silent = false) {
    const countEl = document.getElementById('recordCount');
    if (!silent && countEl) {
        countEl.textContent = 'Loading...';
    }

    let items = [];
    let loadedFromDb = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('class_subjects')
                .select('*')
                .order('created_at', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                items = data.map(row => ({
                    id: row.id,
                    dbId: row.id,
                    classSection: row.class_section || (row.classes && row.classes.class_code) || 'CSE-A',
                    department: row.department || 'CSE',
                    year: row.year || '4th Year',
                    semester: row.semester || '7th Semester',
                    subjectCode: row.subject_code || (row.subjects && row.subjects.subject_code) || 'CS401',
                    subjectName: row.subject_name || (row.subjects && row.subjects.subject_name) || 'Web Technologies',
                    credits: row.credits || 4,
                    facultyAssigned: row.faculty_assigned || 'Dr. K. Srinivas'
                }));
                loadedFromDb = true;
                localStorage.setItem('classSubjectsList', JSON.stringify(items));
            }
        } catch (sbErr) {
            console.warn('[AdminClasses] Error fetching from Supabase, using local fallback:', sbErr);
        }
    }

    if (!loadedFromDb) {
        const stored = localStorage.getItem('classSubjectsList');
        if (stored) {
            try {
                items = JSON.parse(stored);
            } catch (e) {
                items = getDefaultClassSubjects();
            }
        } else {
            items = getDefaultClassSubjects();
            localStorage.setItem('classSubjectsList', JSON.stringify(items));
        }
    }

    currentClassSubjectsCache = items;
    syncClassAndSubjectLists(items);
    renderClassSubjectsTable();
}


// Synchronize unique classes and subjects to localStorage for other pages
function syncClassAndSubjectLists(list) {
    if (!Array.isArray(list)) return;

    const uniqueClasses = [];
    const classCodesSeen = new Set();

    list.forEach(item => {
        if (!classCodesSeen.has(item.classSection)) {
            classCodesSeen.add(item.classSection);
            uniqueClasses.push({
                code: item.classSection,
                section: item.classSection.split('-')[1] || 'A',
                department: item.department,
                year: item.year
            });
        }
    });
    localStorage.setItem('classList', JSON.stringify(uniqueClasses));

    const uniqueSubjects = [];
    const subjectCodesSeen = new Set();

    list.forEach(item => {
        if (!subjectCodesSeen.has(item.subjectCode)) {
            subjectCodesSeen.add(item.subjectCode);
            uniqueSubjects.push({
                code: item.subjectCode,
                name: item.subjectName,
                department: item.department,
                semester: item.semester,
                credits: item.credits
            });
        }
    });
    localStorage.setItem('subjectList', JSON.stringify(uniqueSubjects));
}


// ==============================================================================
// LOAD FACULTY OPTIONS FOR MODAL DROPDOWN
// ==============================================================================

async function loadFacultyOptions() {
    let faculty = [];
    let loadedFromDb = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('faculty')
                .select('faculty_id, name, department, designation')
                .order('faculty_id', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                faculty = data.map(f => ({
                    id: f.faculty_id,
                    name: f.name,
                    department: f.department,
                    designation: f.designation
                }));
                loadedFromDb = true;
                localStorage.setItem('facultyList', JSON.stringify(faculty));
            }
        } catch (sbErr) {
            console.warn('[AdminClasses] Error loading faculty from Supabase, using local fallback:', sbErr);
        }
    }

    if (!loadedFromDb) {
        const stored = localStorage.getItem('facultyList');
        if (stored) {
            try {
                faculty = JSON.parse(stored);
            } catch (e) {
                faculty = getDefaultFaculty();
            }
        } else {
            faculty = getDefaultFaculty();
        }
    }

    availableFacultyCache = faculty;
    populateFacultySelect();
}

function populateFacultySelect(selectedName = '') {
    const select = document.getElementById('facultyAssigned');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Faculty --</option>';

    availableFacultyCache.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = `${f.name} (${f.department || 'Faculty'})`;
        if (selectedName && selectedName === f.name) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}


// ==============================================================================
// RENDER CLASS & SUBJECT TABLE
// ==============================================================================

function renderClassSubjectsTable() {
    const tbody = document.getElementById('classSubjectsTableBody');
    const noDataMsg = document.getElementById('noDataMsg');
    const countEl = document.getElementById('recordCount');

    if (!tbody) return;

    const search = (document.getElementById('searchClasses')?.value || '').toLowerCase().trim();
    const dept = document.getElementById('departmentFilter')?.value || '';
    const year = document.getElementById('yearFilter')?.value || '';

    tbody.innerHTML = '';

    const filtered = currentClassSubjectsCache.filter(item => {
        const matchSearch = !search ||
            (item.classSection && item.classSection.toLowerCase().includes(search)) ||
            (item.department && item.department.toLowerCase().includes(search)) ||
            (item.year && item.year.toLowerCase().includes(search)) ||
            (item.semester && item.semester.toLowerCase().includes(search)) ||
            (item.subjectCode && item.subjectCode.toLowerCase().includes(search)) ||
            (item.subjectName && item.subjectName.toLowerCase().includes(search)) ||
            (item.facultyAssigned && item.facultyAssigned.toLowerCase().includes(search));

        const matchDept = !dept || item.department === dept;
        const matchYear = !year || item.year === year;

        return matchSearch && matchDept && matchYear;
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        if (noDataMsg) noDataMsg.style.display = 'block';
        return;
    }

    if (noDataMsg) noDataMsg.style.display = 'none';

    filtered.forEach((item, index) => {
        const row = document.createElement('tr');
        const escapedId = typeof item.id === 'string' ? `'${item.id}'` : item.id;

        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong style="color: #667eea;">${item.classSection}</strong></td>
            <td><span class="badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.2);">${item.department}</span></td>
            <td>${item.year}</td>
            <td>${item.semester}</td>
            <td><strong style="font-family: monospace; font-size: 13px;">${item.subjectCode}</strong></td>
            <td>${item.subjectName}</td>
            <td><span style="font-weight: 700; color: #27ae60;">${item.credits}</span></td>
            <td>👨‍🏫 ${item.facultyAssigned}</td>
            <td class="action-cell" style="white-space: nowrap;">
                <button class="action-btn edit-btn" onclick="editClassSubject(${escapedId})" title="Edit">✎</button>
                <button class="action-btn delete-btn" onclick="deleteClassSubject(${escapedId})" title="Delete">🗑</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


// ==============================================================================
// FILTERS
// ==============================================================================

function setupFilterListeners() {
    const searchInput = document.getElementById('searchClasses');
    const deptFilter = document.getElementById('departmentFilter');
    const yearFilter = document.getElementById('yearFilter');

    if (searchInput) searchInput.addEventListener('input', renderClassSubjectsTable);
    if (deptFilter) deptFilter.addEventListener('change', renderClassSubjectsTable);
    if (yearFilter) yearFilter.addEventListener('change', renderClassSubjectsTable);
}


// ==============================================================================
// MODAL HANDLERS (ADD & EDIT)
// ==============================================================================

function setupModalHandlers() {
    const modal = document.getElementById('classSubjectModal');
    const addBtn = document.getElementById('addClassSubjectBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const form = document.getElementById('classSubjectForm');

    if (!modal) return;

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            document.getElementById('editItemId').value = '';
            document.getElementById('modalTitle').textContent = 'Add Class / Subject';
            const msgEl = document.getElementById('formMessage');
            if (msgEl) {
                msgEl.textContent = '';
                msgEl.className = 'form-message';
            }
            populateFacultySelect();
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('editItemId').value;
    const classSection = document.getElementById('classSection').value.trim().toUpperCase();
    const department = document.getElementById('department').value;
    const year = document.getElementById('year').value;
    const semester = document.getElementById('semester').value;
    const subjectCode = document.getElementById('subjectCode').value.trim().toUpperCase();
    const subjectName = document.getElementById('subjectName').value.trim();
    const credits = parseInt(document.getElementById('credits').value, 10) || 4;
    const facultyAssigned = document.getElementById('facultyAssigned').value;
    const messageEl = document.getElementById('formMessage');
    const saveBtn = document.getElementById('saveItemBtn');

    if (!classSection || !department || !year || !semester || !subjectCode || !subjectName || !credits || !facultyAssigned) {
        if (messageEl) {
            messageEl.textContent = '❌ Please fill in all required fields.';
            messageEl.className = 'form-message error';
        }
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }

    const payload = {
        class_section: classSection,
        department,
        year,
        semester,
        subject_code: subjectCode,
        subject_name: subjectName,
        credits,
        faculty_assigned: facultyAssigned
    };

    let opSuccess = false;
    let newDbId = null;

    // 1. Try Supabase
    if (window.supabaseClient) {
        try {
            if (editId) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editId);
                const query = window.supabaseClient.from('class_subjects').update(payload);
                const { error } = isUuid ? await query.eq('id', editId) : await query.eq('subject_code', subjectCode);

                if (!error) opSuccess = true;
                else console.warn('[AdminClasses] Supabase update warning:', error);
            } else {
                const { data, error } = await window.supabaseClient
                    .from('class_subjects')
                    .insert([payload])
                    .select('id')
                    .single();

                if (!error) {
                    opSuccess = true;
                    if (data && data.id) newDbId = data.id;

                    // Ensure classes and subjects tables have this entry
                    window.supabaseClient.from('classes').upsert([{
                        class_code: classSection,
                        department,
                        year,
                        section: classSection.split('-')[1] || 'A',
                        semester
                    }], { onConflict: 'class_code' }).then(() => {});

                    window.supabaseClient.from('subjects').upsert([{
                        subject_code: subjectCode,
                        subject_name: subjectName,
                        department,
                        semester,
                        credits
                    }], { onConflict: 'subject_code' }).then(() => {});
                } else {
                    console.warn('[AdminClasses] Supabase insert warning:', error);
                }
            }
        } catch (sbErr) {
            console.warn('[AdminClasses] Supabase operation exception:', sbErr);
        }
    }

    // 2. Update local cache
    const items = [...currentClassSubjectsCache];

    if (editId) {
        const index = items.findIndex(i => String(i.id) === String(editId));
        if (index >= 0) {
            items[index] = {
                id: items[index].id,
                classSection,
                department,
                year,
                semester,
                subjectCode,
                subjectName,
                credits,
                facultyAssigned
            };
        }
        if (messageEl) {
            messageEl.textContent = '✅ Class & Subject updated successfully!';
            messageEl.className = 'form-message success';
        }
    } else {
        const newItem = {
            id: newDbId || Date.now(),
            classSection,
            department,
            year,
            semester,
            subjectCode,
            subjectName,
            credits,
            facultyAssigned
        };
        items.push(newItem);
        if (messageEl) {
            messageEl.textContent = '✅ Class & Subject added successfully!';
            messageEl.className = 'form-message success';
        }
    }

    currentClassSubjectsCache = items;
    localStorage.setItem('classSubjectsList', JSON.stringify(items));
    syncClassAndSubjectLists(items);

    setTimeout(() => {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Class / Subject';
        }
        document.getElementById('classSubjectModal')?.classList.add('hidden');
        renderClassSubjectsTable();
    }, 800);
}


// ==============================================================================
// EDIT FUNCTION
// ==============================================================================

window.editClassSubject = function (id) {
    const item = currentClassSubjectsCache.find(i => String(i.id) === String(id));
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Class / Subject';
    document.getElementById('editItemId').value = item.id;
    document.getElementById('classSection').value = item.classSection || '';
    document.getElementById('department').value = item.department || '';
    document.getElementById('year').value = item.year || '';
    document.getElementById('semester').value = item.semester || '';
    document.getElementById('subjectCode').value = item.subjectCode || '';
    document.getElementById('subjectName').value = item.subjectName || '';
    document.getElementById('credits').value = item.credits || 4;

    const msgEl = document.getElementById('formMessage');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'form-message';
    }

    populateFacultySelect(item.facultyAssigned);
    document.getElementById('classSubjectModal')?.classList.remove('hidden');
};


// ==============================================================================
// DELETE FUNCTION
// ==============================================================================

window.deleteClassSubject = async function (id) {
    const item = currentClassSubjectsCache.find(i => String(i.id) === String(id));
    const label = item ? `${item.classSection} - ${item.subjectName}` : 'this record';

    if (!confirm(`❓ Are you sure you want to delete ${label}?`)) return;

    // 1. Try delete in Supabase
    if (window.supabaseClient) {
        try {
            const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            if (isUuid) {
                await window.supabaseClient.from('class_subjects').delete().eq('id', id);
            } else if (item && item.subjectCode && item.classSection) {
                await window.supabaseClient
                    .from('class_subjects')
                    .delete()
                    .eq('subject_code', item.subjectCode)
                    .eq('class_section', item.classSection);
            }
        } catch (sbErr) {
            console.warn('[AdminClasses] Supabase delete warning:', sbErr);
        }
    }

    // 2. Remove from local cache
    currentClassSubjectsCache = currentClassSubjectsCache.filter(i => String(i.id) !== String(id));
    localStorage.setItem('classSubjectsList', JSON.stringify(currentClassSubjectsCache));
    syncClassAndSubjectLists(currentClassSubjectsCache);
    renderClassSubjectsTable();
};


// ==============================================================================
// DEFAULT DATA
// ==============================================================================

function getDefaultClassSubjects() {
    return [
        {
            id: 101,
            classSection: 'CSE-A',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS401',
            subjectName: 'Web Technologies',
            credits: 4,
            facultyAssigned: 'Dr. K. Srinivas'
        },
        {
            id: 102,
            classSection: 'CSE-A',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS402',
            subjectName: 'Computer Networks',
            credits: 4,
            facultyAssigned: 'Prof. P. Lakshmi'
        },
        {
            id: 103,
            classSection: 'CSE-A',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS403',
            subjectName: 'Machine Learning',
            credits: 4,
            facultyAssigned: 'Dr. M. Venkata Rao'
        },
        {
            id: 104,
            classSection: 'CSE-A',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS404',
            subjectName: 'Cloud Computing',
            credits: 4,
            facultyAssigned: 'Dr. K. Srinivas'
        },
        {
            id: 105,
            classSection: 'CSE-A',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS406',
            subjectName: 'Database Management Systems',
            credits: 4,
            facultyAssigned: 'Dr. Rajesh Sharma'
        },
        {
            id: 106,
            classSection: 'CSE-B',
            department: 'CSE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CS405',
            subjectName: 'Software Engineering',
            credits: 4,
            facultyAssigned: 'Prof. P. Lakshmi'
        },
        {
            id: 107,
            classSection: 'ECE-A',
            department: 'ECE',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'EC401',
            subjectName: 'Digital Signal Processing',
            credits: 4,
            facultyAssigned: 'Prof. S. Raghunath'
        },
        {
            id: 108,
            classSection: 'MECH-A',
            department: 'MECH',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'ME401',
            subjectName: 'Thermodynamics & CAD',
            credits: 4,
            facultyAssigned: 'Dr. B. Prasad'
        }
    ];
}

function getDefaultFaculty() {
    return [
        { id: "FAC001", name: "Dr. K. Srinivas", department: "CSE" },
        { id: "FAC002", name: "Prof. P. Lakshmi", department: "CSE" },
        { id: "FAC003", name: "Dr. M. Venkata Rao", department: "CSE" },
        { id: "FAC004", name: "Dr. Rajesh Sharma", department: "CSE" },
        { id: "FAC005", name: "Prof. S. Raghunath", department: "ECE" },
        { id: "FAC006", name: "Dr. B. Prasad", department: "MECH" },
        { id: "FAC007", name: "Prof. N. Anuradha", department: "CIVIL" }
    ];
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
