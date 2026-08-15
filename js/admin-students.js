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

    initializeStudentsPage();

});


// ==========================================
// INITIALIZE STUDENTS PAGE
// ==========================================

function initializeStudentsPage() {

    setupMenuButton();
    setupLogoutButton();
    setupFilterListeners();
    setupAddStudentButton();
    setupFormHandlers();
    loadAllStudents();

}


// ==========================================
// LOAD ALL STUDENTS
// ==========================================

function loadAllStudents() {

    const students = getStudentsList();
    displayStudents(students);

}


// ==========================================
// DEFAULT 107 STUDENTS LIST
// ==========================================

function getDefaultStudents() {

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
        { rollNo: "23RU1A0520", name: "TARUN SAYIRAM", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0521", name: "CHAKALI USHARANI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0522", name: "C BHARATH KUMAR REDDY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0523", name: "CHALLA SAILIKHITHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0524", name: "C. BHARATHI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0526", name: "DEVARA ANKITHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0527", name: "DUDEKULA JAMALBEE", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0528", name: "EERLA NAGAVENNELA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0529", name: "GAJJI KURUBA MANOJ", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0530", name: "GANDIKOTA MANASA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0531", name: "GOLLA MAHESH BABU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0532", name: "GOSALA PUSHPANJALI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0533", name: "GOTTIPADU DILIP KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0534", name: "ILLURI SANDEEP VARDAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0535", name: "JUTLA GANESH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0536", name: "JYOTHI AKSHAY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0537", name: "KADIRI MADHUSAI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0538", name: "KALLA RAGHU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0539", name: "KANUGALLA HARITHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0540", name: "KANUKUNTLA KEERTHI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0541", name: "KAPATALA GIRI NARASIMHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0542", name: "KONANGI DURGA RUPESH GOUD", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0543", name: "KOSIGI PARAMESH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0544", name: "KUMMARI LAKSHMAN PRADEEP", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0545", name: "KUNDAVARAM SATHVIKA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0546", name: "POOJITHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0547", name: "KURUVA ABHIMANYU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0548", name: "KURAVA SHIVA PRASAD", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0549", name: "LAKKINENI AJITH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0550", name: "LAKKIREDDY LAHARI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0551", name: "LANKAYAPALLE RUPA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0552", name: "M.SUMERA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0553", name: "SUSMITHA. M", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0554", name: "M VIJAY RAJ", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0555", name: "MADIGA CHAITHANYA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0556", name: "MADIGA GOVINDU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0557", name: "MADIGA NAGESWARI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0558", name: "MALA RAGHAVENDRA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0559", name: "M.ASHOK", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0561", name: "MANCHALA GOWTHAM", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0562", name: "MANGALA DIVYA SREE", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0563", name: "MANGALA SAISANDHYA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0564", name: "MARUPATI PAVAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0565", name: "MOHAMMED ASADULLAH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0566", name: "MOLLA.HAFIZ RAHAMAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0567", name: "MOTA YUVA RAJU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0568", name: "MUDDAM SHYAM SUNDAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0569", name: "MULINTI HARSHITHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0570", name: "MULUGURU VAMSI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0571", name: "NADIMINTI TEJA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0572", name: "PAIENTI LAKSHMI KANTHA REDDY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0573", name: "PALAMARRI GNANA KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0574", name: "PENKI RAMU", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0575", name: "PINJARI CHAND BASHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0576", name: "PINJARI ZUBEDA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0577", name: "PITTU SREEVIDYA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0578", name: "POTHU PALLAVI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0579", name: "POTHULA SAKETH RAM", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0580", name: "PUJARI LAKSHMI LOKESH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0581", name: "PUJARI MADHURI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0582", name: "P.TEJASWINI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0583", name: "SHAIK AFRID", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0585", name: "SHAIK ARSHAD", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0586", name: "SHAIK CARPENTER MOHAMMED REHAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0587", name: "SHAIK.MUJIBUR RAHEMAN", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0588", name: "SHAIK TAPAL UBEDULLAH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0589", name: "SREENIVASULU GARI BALAJI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0590", name: "SREERAMAPPAGARI MAHALAKSHMI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0591", name: "TALARI KEERTHANA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0592", name: "TELUGU HARSHITH", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0593", name: "THADAKARA MADHAN KUMAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0594", name: "THATHANA BOINA RAMPRASAD", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0595", name: "THOGATA YELLA NAGANANDINI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0596", name: "THOTA RAJASIMHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0597", name: "TOTTARAMUDI RECHAL", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0598", name: "TUMMALAPENTA VENUGOPAL", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A0599", name: "UDAYAGIRI NIKHILESWAR", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A0", name: "UPPARA SRAVANTHI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A1", name: "UPPARA VENKATESWARI", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A2", name: "V.KARTHIK", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A3", name: "VADDE DANIEL", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A4", name: "VAKKALAGADDA BALA BHARADWAJ", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A5", name: "Y PRANAY KUMAR REDDY", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A6", name: "YADAMALA HEMALATHA", department: "CSE", year: "4th Year" },
        { rollNo: "23RU1A05A7", name: "MADIGA KRUPAVARAM", department: "CSE", year: "4th Year" }
    ];

}


// ==========================================
// GET STUDENTS LIST
// ==========================================

function getStudentsList() {

    const storedStudents = localStorage.getItem('adminStudentsList');

    if (storedStudents) {
        return JSON.parse(storedStudents);
    }

    const defaults = getDefaultStudents();
    localStorage.setItem('adminStudentsList', JSON.stringify(defaults));
    return defaults;

}


// ==========================================
// DISPLAY STUDENTS IN TABLE
// ==========================================

function displayStudents(students) {

    const tbody = document.getElementById('studentsTableBody');
    const noMsg = document.getElementById('noStudentsMsg');
    const countEl = document.getElementById('studentCount');

    tbody.innerHTML = '';

    if (students.length === 0) {
        noMsg.style.display = 'block';
        countEl.textContent = '0 students';
        return;
    }

    noMsg.style.display = 'none';
    countEl.textContent = students.length + ' students';

    students.forEach((student, index) => {

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${student.rollNo}</strong></td>
            <td>${student.name}</td>
            <td>${student.department || 'CSE'}</td>
            <td>${student.year || '4th Year'}</td>
            <td class="action-cell">
                <button class="action-btn edit-btn" onclick="editStudent('${student.rollNo}')" title="Edit Student">✎</button>
                <button class="action-btn delete-btn" onclick="deleteStudent('${student.rollNo}')" title="Delete Student">🗑</button>
            </td>
        `;

        tbody.appendChild(row);

    });

}


// ==========================================
// FILTER LISTENERS
// ==========================================

function setupFilterListeners() {

    const searchInput = document.getElementById('searchStudent');
    const departmentFilter = document.getElementById('departmentFilter');
    const yearFilter = document.getElementById('yearFilter');

    function applyFilters() {

        const students = getStudentsList();
        const search = searchInput.value.toLowerCase();
        const department = departmentFilter.value;
        const year = yearFilter.value;

        const filtered = students.filter(s => {

            const matchSearch = !search || 
                (s.name && s.name.toLowerCase().includes(search)) || 
                (s.rollNo && s.rollNo.toLowerCase().includes(search));

            const matchDept = !department || s.department === department;
            const matchYear = !year || s.year === year;

            return matchSearch && matchDept && matchYear;

        });

        displayStudents(filtered);

    }

    searchInput.addEventListener('input', applyFilters);
    departmentFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);

}


// ==========================================
// ADD STUDENT BUTTON
// ==========================================

function setupAddStudentButton() {

    const addBtn = document.getElementById('addStudentBtn');
    const modal = document.getElementById('studentModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const rollInput = document.getElementById('rollNumber');

    addBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Add Student';
        document.getElementById('studentForm').reset();
        document.getElementById('formMessage').textContent = '';
        rollInput.disabled = false;
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

}


// ==========================================
// FORM HANDLERS
// ==========================================

function setupFormHandlers() {

    const form = document.getElementById('studentForm');

    form.addEventListener('submit', (e) => {

        e.preventDefault();

        const rollNumber = document.getElementById('rollNumber').value.trim().toUpperCase();
        const studentName = document.getElementById('studentName').value.trim();
        const department = document.getElementById('department').value;
        const year = document.getElementById('year').value;
        const messageEl = document.getElementById('formMessage');

        if (!rollNumber || !studentName || !department || !year) {
            showMessage(messageEl, '❌ All fields are required', 'error');
            return;
        }

        const students = getStudentsList();
        const existingIndex = students.findIndex(s => s.rollNo === rollNumber);

        if (existingIndex >= 0) {
            // Edit existing
            students[existingIndex] = { rollNo: rollNumber, name: studentName, department, year };
            showMessage(messageEl, '✅ Student updated successfully', 'success');
        } else {
            // Add new
            students.push({ rollNo: rollNumber, name: studentName, department, year });
            showMessage(messageEl, '✅ Student added successfully', 'success');
        }

        localStorage.setItem('adminStudentsList', JSON.stringify(students));

        setTimeout(() => {
            document.getElementById('studentModal').classList.add('hidden');
            loadAllStudents();
        }, 1200);

    });

}


// ==========================================
// EDIT STUDENT
// ==========================================

window.editStudent = function (rollNo) {

    const students = getStudentsList();
    const student = students.find(s => s.rollNo === rollNo);

    if (!student) return;

    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('rollNumber').value = student.rollNo;
    document.getElementById('studentName').value = student.name;
    document.getElementById('department').value = student.department || 'CSE';
    document.getElementById('year').value = student.year || '4th Year';
    document.getElementById('rollNumber').disabled = true;
    document.getElementById('formMessage').textContent = '';

    document.getElementById('studentModal').classList.remove('hidden');

};


// ==========================================
// DELETE STUDENT
// ==========================================

window.deleteStudent = function (rollNo) {

    if (!confirm(`❓ Are you sure you want to delete student ${rollNo}?`)) return;

    let students = getStudentsList();
    students = students.filter(s => s.rollNo !== rollNo);

    localStorage.setItem('adminStudentsList', JSON.stringify(students));
    loadAllStudents();

};


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(element, message, type) {

    element.textContent = message;
    element.className = `form-message ${type}`;

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
