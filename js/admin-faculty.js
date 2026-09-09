// ==============================================================================
// ADMIN FACULTY DIRECTORY & MANAGEMENT (PHASE 8)
// ==============================================================================
// Fully integrated with Supabase 'faculty' table, featuring Realtime updates,
// advanced search, department filtering, and offline localStorage fallback.
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

    initializeFacultyPage();
});


// State
let currentFacultyCache = [];
let realtimeChannel = null;


// Initialize Faculty Page
function initializeFacultyPage() {
    setupMenuButton();
    setupLogoutButton();
    setupFacultyModal();
    setupFilterListeners();
    setupRealtimeFaculty();

    // Initial load
    loadAllFaculty();
}


// ==============================================================================
// SUPABASE REALTIME SUBSCRIPTION
// ==============================================================================

function setupRealtimeFaculty() {
    if (!window.supabaseClient) return;

    try {
        if (realtimeChannel) {
            window.supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = window.supabaseClient
            .channel('public:faculty')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'faculty' },
                () => {
                    console.log('[AdminFaculty] Realtime faculty update received, refreshing...');
                    loadAllFaculty(true);
                }
            )
            .subscribe();
    } catch (err) {
        console.warn('[AdminFaculty] Realtime subscription error:', err);
    }
}


// ==============================================================================
// LOAD FACULTY DATA (SUPABASE + FALLBACK)
// ==============================================================================

async function loadAllFaculty(silent = false) {
    const countEl = document.getElementById('facultyCount');
    if (!silent && countEl) {
        countEl.textContent = 'Loading...';
    }

    let faculty = [];
    let loadedFromDb = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('faculty')
                .select('*')
                .order('faculty_id', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                faculty = data.map(f => ({
                    id: f.faculty_id,
                    dbId: f.id,
                    name: f.name || 'Faculty Member',
                    department: f.department || 'CSE',
                    designation: f.designation || 'Assistant Professor',
                    email: f.email || '',
                    phone: f.phone || '',
                    assignedSubjects: f.assigned_subjects || ''
                }));
                loadedFromDb = true;
                localStorage.setItem('facultyList', JSON.stringify(faculty));
            }
        } catch (sbErr) {
            console.warn('[AdminFaculty] Error fetching from Supabase, using local fallback:', sbErr);
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
            localStorage.setItem('facultyList', JSON.stringify(faculty));
        }
    }

    currentFacultyCache = faculty;
    renderFacultyTable();
}


// ==============================================================================
// RENDER FACULTY TABLE
// ==============================================================================

function renderFacultyTable() {
    const tbody = document.getElementById('facultyTableBody');
    const noFacultyMsg = document.getElementById('noFacultyMsg');
    const countEl = document.getElementById('facultyCount');

    if (!tbody) return;

    const search = (document.getElementById('searchFaculty')?.value || '').toLowerCase().trim();
    const dept = document.getElementById('facultyDeptFilter')?.value || '';

    tbody.innerHTML = '';

    const filtered = currentFacultyCache.filter(item => {
        const matchSearch = !search ||
            (item.id && item.id.toLowerCase().includes(search)) ||
            (item.name && item.name.toLowerCase().includes(search)) ||
            (item.department && item.department.toLowerCase().includes(search)) ||
            (item.designation && item.designation.toLowerCase().includes(search)) ||
            (item.email && item.email.toLowerCase().includes(search)) ||
            (item.assignedSubjects && item.assignedSubjects.toLowerCase().includes(search));

        const matchDept = !dept || item.department === dept;

        return matchSearch && matchDept;
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} member${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        if (noFacultyMsg) noFacultyMsg.style.display = 'block';
        return;
    }

    if (noFacultyMsg) noFacultyMsg.style.display = 'none';

    filtered.forEach((f, index) => {
        const row = document.createElement('tr');
        const escapedId = typeof f.id === 'string' ? `'${f.id}'` : f.id;

        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong style="font-family: monospace; color: #667eea; font-size: 13px;">${f.id}</strong></td>
            <td><strong>${f.name}</strong></td>
            <td><span class="badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.2);">${f.department}</span></td>
            <td>${f.designation}</td>
            <td><a href="mailto:${f.email}" style="color: #667eea; text-decoration: none;">${f.email}</a></td>
            <td>${f.phone}</td>
            <td><small style="color: #555;">${f.assignedSubjects}</small></td>
            <td class="action-cell" style="white-space: nowrap;">
                <button class="action-btn edit-btn" onclick="editFaculty(${escapedId})" title="Edit">✎</button>
                <button class="action-btn delete-btn" onclick="deleteFaculty(${escapedId})" title="Delete">🗑</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


// ==============================================================================
// FILTERS
// ==============================================================================

function setupFilterListeners() {
    const searchInput = document.getElementById('searchFaculty');
    const deptFilter = document.getElementById('facultyDeptFilter');

    if (searchInput) searchInput.addEventListener('input', renderFacultyTable);
    if (deptFilter) deptFilter.addEventListener('change', renderFacultyTable);
}


// ==============================================================================
// MODAL SETUP & SUBMIT
// ==============================================================================

function setupFacultyModal() {
    const modal = document.getElementById('facultyModal');
    const addBtn = document.getElementById('addFacultyBtn');
    const closeBtn = document.getElementById('closeFacultyModal');
    const cancelBtn = document.getElementById('cancelFacultyBtn');
    const form = document.getElementById('facultyForm');

    if (!modal) return;

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            form.reset();
            document.getElementById('facultyEditId').value = '';
            document.getElementById('facultyId').disabled = false;
            document.getElementById('facultyModalTitle').textContent = 'Add Faculty Member';
            const msgEl = document.getElementById('facultyFormMessage');
            if (msgEl) {
                msgEl.textContent = '';
                msgEl.className = 'form-message';
            }
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    if (form) {
        form.addEventListener('submit', handleFacultySubmit);
    }
}

async function handleFacultySubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('facultyEditId').value;
    const id = document.getElementById('facultyId').value.trim().toUpperCase();
    const name = document.getElementById('facultyName').value.trim();
    const department = document.getElementById('facultyDept').value;
    const designation = document.getElementById('facultyDesignation').value;
    const email = document.getElementById('facultyEmail').value.trim();
    const phone = document.getElementById('facultyPhone').value.trim();
    const assignedSubjects = document.getElementById('facultySubjects').value.trim();
    const messageEl = document.getElementById('facultyFormMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!id || !name || !department || !designation || !email || !phone || !assignedSubjects) {
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
        faculty_id: id,
        name,
        department,
        designation,
        email,
        phone,
        assigned_subjects: assignedSubjects
    };

    let opSuccess = false;

    // 1. Try Supabase
    if (window.supabaseClient) {
        try {
            if (editId) {
                const { error } = await window.supabaseClient
                    .from('faculty')
                    .update({
                        name,
                        department,
                        designation,
                        email,
                        phone,
                        assigned_subjects: assignedSubjects
                    })
                    .eq('faculty_id', editId);

                if (!error) opSuccess = true;
                else console.warn('[AdminFaculty] Supabase update warning:', error);
            } else {
                // Check if ID already exists in DB
                const { data: existing } = await window.supabaseClient
                    .from('faculty')
                    .select('id')
                    .eq('faculty_id', id)
                    .maybeSingle();

                if (existing) {
                    if (messageEl) {
                        messageEl.textContent = '❌ Faculty ID already exists in database!';
                        messageEl.className = 'form-message error';
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Save Faculty';
                    }
                    return;
                }

                const { error } = await window.supabaseClient
                    .from('faculty')
                    .insert([payload]);

                if (!error) opSuccess = true;
                else console.warn('[AdminFaculty] Supabase insert warning:', error);
            }
        } catch (sbErr) {
            console.warn('[AdminFaculty] Supabase operation exception:', sbErr);
        }
    }

    // 2. Update local cache
    const facultyList = [...currentFacultyCache];

    if (editId) {
        const index = facultyList.findIndex(f => f.id === editId);
        if (index >= 0) {
            facultyList[index] = {
                id: editId,
                name,
                department,
                designation,
                email,
                phone,
                assignedSubjects
            };
        }
        if (messageEl) {
            messageEl.textContent = '✅ Faculty member updated successfully!';
            messageEl.className = 'form-message success';
        }
    } else {
        const exists = facultyList.some(f => f.id === id);
        if (exists && !opSuccess) {
            if (messageEl) {
                messageEl.textContent = '❌ Faculty ID already exists!';
                messageEl.className = 'form-message error';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Faculty';
            }
            return;
        }

        facultyList.push({
            id,
            name,
            department,
            designation,
            email,
            phone,
            assignedSubjects
        });
        if (messageEl) {
            messageEl.textContent = '✅ Faculty member added successfully!';
            messageEl.className = 'form-message success';
        }
    }

    currentFacultyCache = facultyList;
    localStorage.setItem('facultyList', JSON.stringify(facultyList));

    setTimeout(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Faculty';
        }
        document.getElementById('facultyModal')?.classList.add('hidden');
        renderFacultyTable();
    }, 800);
}


// ==============================================================================
// EDIT FACULTY
// ==============================================================================

window.editFaculty = function (id) {
    const f = currentFacultyCache.find(item => item.id === id);
    if (!f) return;

    document.getElementById('facultyModalTitle').textContent = 'Edit Faculty Member';
    document.getElementById('facultyEditId').value = f.id;
    document.getElementById('facultyId').value = f.id;
    document.getElementById('facultyId').disabled = true;
    document.getElementById('facultyName').value = f.name || '';
    document.getElementById('facultyDept').value = f.department || '';
    document.getElementById('facultyDesignation').value = f.designation || 'Assistant Professor';
    document.getElementById('facultyEmail').value = f.email || '';
    document.getElementById('facultyPhone').value = f.phone || '';
    document.getElementById('facultySubjects').value = f.assignedSubjects || '';

    const msgEl = document.getElementById('facultyFormMessage');
    if (msgEl) {
        msgEl.textContent = '';
        msgEl.className = 'form-message';
    }

    document.getElementById('facultyModal')?.classList.remove('hidden');
};


// ==============================================================================
// DELETE FACULTY
// ==============================================================================

window.deleteFaculty = async function (id) {
    const f = currentFacultyCache.find(item => item.id === id);
    const label = f ? `${f.name} (${f.id})` : id;

    if (!confirm(`❓ Are you sure you want to delete faculty member ${label}?`)) return;

    // 1. Try Supabase
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('faculty').delete().eq('faculty_id', id);
        } catch (sbErr) {
            console.warn('[AdminFaculty] Supabase delete warning:', sbErr);
        }
    }

    // 2. Remove from local cache
    currentFacultyCache = currentFacultyCache.filter(item => item.id !== id);
    localStorage.setItem('facultyList', JSON.stringify(currentFacultyCache));
    renderFacultyTable();
};


// ==============================================================================
// DEFAULT FACULTY DATA
// ==============================================================================

function getDefaultFaculty() {
    return [
        {
            id: "FAC001",
            name: "Dr. K. Srinivas",
            department: "CSE",
            designation: "Professor & HOD",
            email: "srinivas.k@college.edu",
            phone: "+91 98765 43201",
            assignedSubjects: "Web Technologies, Cloud Computing"
        },
        {
            id: "FAC002",
            name: "Prof. P. Lakshmi",
            department: "CSE",
            designation: "Associate Professor",
            email: "lakshmi.p@college.edu",
            phone: "+91 98765 43202",
            assignedSubjects: "Computer Networks, Software Engineering"
        },
        {
            id: "FAC003",
            name: "Dr. M. Venkata Rao",
            department: "CSE",
            designation: "Professor",
            email: "venkatarao.m@college.edu",
            phone: "+91 98765 43203",
            assignedSubjects: "Machine Learning, Artificial Intelligence"
        },
        {
            id: "FAC004",
            name: "Dr. Rajesh Sharma",
            department: "CSE",
            designation: "Associate Professor",
            email: "rajesh.sharma@college.edu",
            phone: "+91 98765 43204",
            assignedSubjects: "Database Management Systems, Cryptography"
        },
        {
            id: "FAC005",
            name: "Prof. S. Raghunath",
            department: "ECE",
            designation: "Professor & HOD",
            email: "raghunath.s@college.edu",
            phone: "+91 98765 43205",
            assignedSubjects: "Digital Signal Processing, VLSI Design"
        },
        {
            id: "FAC006",
            name: "Dr. B. Prasad",
            department: "MECH",
            designation: "Professor & HOD",
            email: "prasad.b@college.edu",
            phone: "+91 98765 43206",
            assignedSubjects: "Thermodynamics & CAD, Fluid Mechanics"
        },
        {
            id: "FAC007",
            name: "Prof. N. Anuradha",
            department: "CIVIL",
            designation: "Assistant Professor",
            email: "anuradha.n@college.edu",
            phone: "+91 98765 43207",
            assignedSubjects: "Structural Engineering, Surveying"
        }
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
