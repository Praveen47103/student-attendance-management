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

    initializeClassesPage();

});


// ==========================================
// INITIALIZE PAGE
// ==========================================

function initializeClassesPage() {

    setupMenuButton();
    setupLogoutButton();
    setupModalHandlers();
    setupFilterListeners();
    renderClassSubjectsTable();

}


// ==========================================
// DEFAULT CLASS & SUBJECT DATA
// ==========================================

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
        },
        {
            id: 109,
            classSection: 'CIVIL-A',
            department: 'CIVIL',
            year: '4th Year',
            semester: '7th Semester',
            subjectCode: 'CE401',
            subjectName: 'Structural Engineering',
            credits: 4,
            facultyAssigned: 'Prof. N. Anuradha'
        }
    ];

}


// ==========================================
// GET & SYNC DATA
// ==========================================

function getClassSubjectsList() {

    const stored = localStorage.getItem('classSubjectsList');
    if (stored) {
        return JSON.parse(stored);
    }

    const defaults = getDefaultClassSubjects();
    saveClassSubjectsList(defaults);
    return defaults;

}

function saveClassSubjectsList(list) {

    localStorage.setItem('classSubjectsList', JSON.stringify(list));

    // Synchronize unique classes for dropdowns in other modules
    const uniqueClasses = [];
    const classCodesSeen = new Set();

    list.forEach(item => {
        if (!classCodesSeen.has(item.classSection)) {
            classCodesSeen.add(item.classSection);
            uniqueClasses.push({
                code: item.classSection,
                section: item.classSection.split('-')[1] || 'A',
                department: item.department,
                year: item.year,
                strength: 60
            });
        }
    });

    localStorage.setItem('classList', JSON.stringify(uniqueClasses));

    // Synchronize unique subjects for other modules
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


// ==========================================
// GET FACULTY LIST
// ==========================================

function getAvailableFaculty() {

    const stored = localStorage.getItem('facultyList');
    if (stored) {
        return JSON.parse(stored);
    }

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


// ==========================================
// POPULATE FACULTY SELECT IN MODAL
// ==========================================

function populateFacultySelect(selectedName = '') {

    const select = document.getElementById('facultyAssigned');
    const facultyList = getAvailableFaculty();

    select.innerHTML = '<option value="">-- Select Faculty --</option>';

    facultyList.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = `${f.name} (${f.department || 'Faculty'})`;
        if (selectedName && selectedName === f.name) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

}


// ==========================================
// RENDER TABLE
// ==========================================

function renderClassSubjectsTable() {

    const items = getClassSubjectsList();
    const tbody = document.getElementById('classSubjectsTableBody');
    const noDataMsg = document.getElementById('noDataMsg');
    const countEl = document.getElementById('recordCount');

    const search = document.getElementById('searchClasses').value.toLowerCase().trim();
    const dept = document.getElementById('departmentFilter').value;
    const year = document.getElementById('yearFilter').value;

    tbody.innerHTML = '';

    const filtered = items.filter(item => {
        const matchSearch = !search ||
            item.classSection.toLowerCase().includes(search) ||
            item.department.toLowerCase().includes(search) ||
            item.year.toLowerCase().includes(search) ||
            item.semester.toLowerCase().includes(search) ||
            item.subjectCode.toLowerCase().includes(search) ||
            item.subjectName.toLowerCase().includes(search) ||
            item.facultyAssigned.toLowerCase().includes(search);

        const matchDept = !dept || item.department === dept;
        const matchYear = !year || item.year === year;

        return matchSearch && matchDept && matchYear;
    });

    countEl.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        noDataMsg.style.display = 'block';
        return;
    }

    noDataMsg.style.display = 'none';

    filtered.forEach((item, index) => {
        const row = document.createElement('tr');

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
                <button class="action-btn edit-btn" onclick="editClassSubject(${item.id})" title="Edit">✎</button>
                <button class="action-btn delete-btn" onclick="deleteClassSubject(${item.id})" title="Delete">🗑</button>
            </td>
        `;

        tbody.appendChild(row);
    });

}


// ==========================================
// FILTERS
// ==========================================

function setupFilterListeners() {

    const searchInput = document.getElementById('searchClasses');
    const deptFilter = document.getElementById('departmentFilter');
    const yearFilter = document.getElementById('yearFilter');

    searchInput.addEventListener('input', renderClassSubjectsTable);
    deptFilter.addEventListener('change', renderClassSubjectsTable);
    yearFilter.addEventListener('change', renderClassSubjectsTable);

}


// ==========================================
// MODAL HANDLERS (ADD & EDIT)
// ==========================================

function setupModalHandlers() {

    const modal = document.getElementById('classSubjectModal');
    const addBtn = document.getElementById('addClassSubjectBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const form = document.getElementById('classSubjectForm');

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('editItemId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Class / Subject';
        document.getElementById('formMessage').textContent = '';
        populateFacultySelect();
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    form.addEventListener('submit', handleFormSubmit);

}

function handleFormSubmit(e) {

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

    if (!classSection || !department || !year || !semester || !subjectCode || !subjectName || !credits || !facultyAssigned) {
        messageEl.textContent = '❌ Please fill in all required fields.';
        messageEl.className = 'form-message error';
        return;
    }

    let items = getClassSubjectsList();

    if (editId) {
        // Update existing
        const targetId = parseInt(editId, 10);
        const index = items.findIndex(i => i.id === targetId);

        if (index >= 0) {
            items[index] = {
                id: targetId,
                classSection,
                department,
                year,
                semester,
                subjectCode,
                subjectName,
                credits,
                facultyAssigned
            };
            messageEl.textContent = '✅ Class & Subject updated successfully!';
            messageEl.className = 'form-message success';
        }
    } else {
        // Add new
        const newItem = {
            id: Date.now(),
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
        messageEl.textContent = '✅ Class & Subject added successfully!';
        messageEl.className = 'form-message success';
    }

    saveClassSubjectsList(items);

    setTimeout(() => {
        document.getElementById('classSubjectModal').classList.add('hidden');
        renderClassSubjectsTable();
    }, 1000);

}


// ==========================================
// EDIT FUNCTION
// ==========================================

window.editClassSubject = function (id) {

    const items = getClassSubjectsList();
    const item = items.find(i => i.id === id);

    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Class / Subject';
    document.getElementById('editItemId').value = item.id;
    document.getElementById('classSection').value = item.classSection;
    document.getElementById('department').value = item.department;
    document.getElementById('year').value = item.year;
    document.getElementById('semester').value = item.semester;
    document.getElementById('subjectCode').value = item.subjectCode;
    document.getElementById('subjectName').value = item.subjectName;
    document.getElementById('credits').value = item.credits;
    document.getElementById('formMessage').textContent = '';

    populateFacultySelect(item.facultyAssigned);

    document.getElementById('classSubjectModal').classList.remove('hidden');

};


// ==========================================
// DELETE FUNCTION
// ==========================================

window.deleteClassSubject = function (id) {

    if (!confirm('❓ Are you sure you want to delete this class & subject record?')) return;

    let items = getClassSubjectsList();
    items = items.filter(i => i.id !== id);

    saveClassSubjectsList(items);
    renderClassSubjectsTable();

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
