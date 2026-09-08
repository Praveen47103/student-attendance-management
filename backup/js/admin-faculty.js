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

    initializeFacultyPage();

});


// ==========================================
// INITIALIZE FACULTY PAGE
// ==========================================

function initializeFacultyPage() {

    setupMenuButton();
    setupLogoutButton();
    setupFacultyModal();
    setupFilterListeners();
    renderFacultyTable();

}


// ==========================================
// DEFAULT FACULTY DATA
// ==========================================

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

function getFacultyList() {

    const stored = localStorage.getItem('facultyList');
    if (stored) {
        return JSON.parse(stored);
    }

    const defaults = getDefaultFaculty();
    localStorage.setItem('facultyList', JSON.stringify(defaults));
    return defaults;

}

function saveFacultyList(list) {
    localStorage.setItem('facultyList', JSON.stringify(list));
}


// ==========================================
// RENDER FACULTY TABLE
// ==========================================

function renderFacultyTable() {

    const faculty = getFacultyList();
    const tbody = document.getElementById('facultyTableBody');
    const noMsg = document.getElementById('noFacultyMsg');
    const countEl = document.getElementById('facultyCount');

    const search = document.getElementById('searchFaculty').value.toLowerCase().trim();
    const dept = document.getElementById('facultyDeptFilter').value;

    tbody.innerHTML = '';

    const filtered = faculty.filter(f => {
        const matchSearch = !search ||
            f.id.toLowerCase().includes(search) ||
            f.name.toLowerCase().includes(search) ||
            f.department.toLowerCase().includes(search) ||
            (f.designation && f.designation.toLowerCase().includes(search)) ||
            f.email.toLowerCase().includes(search) ||
            (f.phone && f.phone.toLowerCase().includes(search)) ||
            (f.assignedSubjects && f.assignedSubjects.toLowerCase().includes(search));

        const matchDept = !dept || f.department === dept;

        return matchSearch && matchDept;
    });

    countEl.textContent = `${filtered.length} member${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';

    filtered.forEach((f, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td><strong style="color: #667eea; font-family: monospace; font-size: 13px;">${f.id}</strong></td>
            <td><strong>${f.name}</strong></td>
            <td><span class="badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.2);">${f.department}</span></td>
            <td>${f.designation || 'Faculty'}</td>
            <td><a href="mailto:${f.email}" style="color: #667eea; text-decoration: none;">${f.email}</a></td>
            <td style="color: #555;">${f.phone || '-'}</td>
            <td><span style="font-size: 12px; color: #444;">${f.assignedSubjects || '-'}</span></td>
            <td class="action-cell" style="white-space: nowrap;">
                <button class="action-btn edit-btn" onclick="editFaculty('${f.id}')" title="Edit Faculty">✎</button>
                <button class="action-btn delete-btn" onclick="deleteFaculty('${f.id}')" title="Delete Faculty">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });

}


// ==========================================
// FILTERS
// ==========================================

function setupFilterListeners() {

    const searchInput = document.getElementById('searchFaculty');
    const deptFilter = document.getElementById('facultyDeptFilter');

    searchInput.addEventListener('input', renderFacultyTable);
    deptFilter.addEventListener('change', renderFacultyTable);

}


// ==========================================
// FACULTY MODAL HANDLERS
// ==========================================

function setupFacultyModal() {

    const addBtn = document.getElementById('addFacultyBtn');
    const modal = document.getElementById('facultyModal');
    const closeBtn = document.getElementById('closeFacultyModal');
    const cancelBtn = document.getElementById('cancelFacultyBtn');
    const form = document.getElementById('facultyForm');

    if (!modal) return;

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('facultyEditId').value = '';
        document.getElementById('facultyId').disabled = false;
        document.getElementById('facultyModalTitle').textContent = 'Add Faculty Member';
        document.getElementById('facultyFormMessage').textContent = '';
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    form.addEventListener('submit', (e) => {
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

        if (!id || !name || !department || !designation || !email || !phone || !assignedSubjects) {
            messageEl.textContent = '❌ Please fill in all required fields.';
            messageEl.className = 'form-message error';
            return;
        }

        let facultyList = getFacultyList();

        if (editId) {
            // Edit existing
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
                messageEl.textContent = '✅ Faculty member updated successfully!';
                messageEl.className = 'form-message success';
            }
        } else {
            // Add new - check if ID exists
            const exists = facultyList.some(f => f.id === id);
            if (exists) {
                messageEl.textContent = '❌ Faculty ID already exists!';
                messageEl.className = 'form-message error';
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

            messageEl.textContent = '✅ Faculty member added successfully!';
            messageEl.className = 'form-message success';
        }

        saveFacultyList(facultyList);

        setTimeout(() => {
            modal.classList.add('hidden');
            renderFacultyTable();
        }, 1000);
    });

}


// ==========================================
// EDIT FACULTY
// ==========================================

window.editFaculty = function (id) {

    const facultyList = getFacultyList();
    const f = facultyList.find(item => item.id === id);

    if (!f) return;

    document.getElementById('facultyModalTitle').textContent = 'Edit Faculty Member';
    document.getElementById('facultyEditId').value = f.id;
    document.getElementById('facultyId').value = f.id;
    document.getElementById('facultyId').disabled = true;
    document.getElementById('facultyName').value = f.name;
    document.getElementById('facultyDept').value = f.department;
    document.getElementById('facultyDesignation').value = f.designation || 'Assistant Professor';
    document.getElementById('facultyEmail').value = f.email;
    document.getElementById('facultyPhone').value = f.phone || '';
    document.getElementById('facultySubjects').value = f.assignedSubjects || '';
    document.getElementById('facultyFormMessage').textContent = '';

    document.getElementById('facultyModal').classList.remove('hidden');

};


// ==========================================
// DELETE FACULTY
// ==========================================

window.deleteFaculty = function (id) {

    if (!confirm(`❓ Are you sure you want to delete faculty member ${id}?`)) return;

    let facultyList = getFacultyList();
    facultyList = facultyList.filter(f => f.id !== id);

    saveFacultyList(facultyList);
    renderFacultyTable();

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
