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
    setupCsvImport();
    loadAllStudents();

}


// ==========================================
// LOAD ALL STUDENTS (SUPABASE + FALLBACK)
// ==========================================

let currentStudentsCache = [];

async function loadAllStudents() {

    let students = [];
    let loadedFromDb = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('students')
                .select('*')
                .order('roll_number', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                students = data.map(s => ({
                    rollNo: s.roll_number,
                    name: s.name || s.roll_number,
                    department: s.department || 'CSE',
                    year: s.year || '4th Year',
                    id: s.id,
                    dbId: s.id
                }));
                loadedFromDb = true;
                localStorage.setItem('adminStudentsList', JSON.stringify(students));
            }
        } catch (sbErr) {
            console.warn('[AdminStudents] Error fetching from Supabase, using local fallback:', sbErr);
        }
    }

    if (!loadedFromDb) {
        students = getStudentsList();
    }

    currentStudentsCache = students;
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
// GET STUDENTS LIST (LOCAL STORAGE)
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

    if (!students || students.length === 0) {
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

        const students = currentStudentsCache.length > 0 ? currentStudentsCache : getStudentsList();
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
// FORM HANDLERS (ADD / EDIT)
// ==========================================

function setupFormHandlers() {

    const form = document.getElementById('studentForm');
    const saveBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {

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

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const students = getStudentsList();
        const existingIndex = students.findIndex(s => s.rollNo === rollNumber);
        const isEdit = existingIndex >= 0;

        // 1. Sync to Supabase if connected
        if (window.supabaseClient) {
            try {
                if (isEdit) {
                    const { error } = await window.supabaseClient
                        .from('students')
                        .update({
                            name: studentName,
                            department: department,
                            year: year
                        })
                        .eq('roll_number', rollNumber);

                    if (error) console.warn('[AdminStudents] Supabase update warning:', error.message);
                } else {
                    const { error } = await window.supabaseClient
                        .from('students')
                        .insert({
                            roll_number: rollNumber,
                            name: studentName,
                            department: department,
                            year: year,
                            semester: '7th Semester',
                            section: 'A'
                        });

                    if (error) console.warn('[AdminStudents] Supabase insert warning:', error.message);
                }
            } catch (sbErr) {
                console.warn('[AdminStudents] Supabase save error:', sbErr);
            }
        }

        // 2. Sync to local storage
        if (isEdit) {
            students[existingIndex] = { ...students[existingIndex], rollNo: rollNumber, name: studentName, department, year };
            showMessage(messageEl, '✅ Student updated successfully', 'success');
        } else {
            students.push({ rollNo: rollNumber, name: studentName, department, year });
            showMessage(messageEl, '✅ Student added successfully', 'success');
        }

        localStorage.setItem('adminStudentsList', JSON.stringify(students));
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Student';

        setTimeout(() => {
            document.getElementById('studentModal').classList.add('hidden');
            loadAllStudents();
        }, 1000);

    });

}


// ==========================================
// EDIT STUDENT
// ==========================================

window.editStudent = function (rollNo) {

    const students = currentStudentsCache.length > 0 ? currentStudentsCache : getStudentsList();
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

window.deleteStudent = async function (rollNo) {

    if (!confirm(`❓ Are you sure you want to delete student ${rollNo}?`)) return;

    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('students')
                .delete()
                .eq('roll_number', rollNo);

            if (error) console.warn('[AdminStudents] Supabase delete warning:', error.message);
        } catch (sbErr) {
            console.warn('[AdminStudents] Supabase delete error:', sbErr);
        }
    }

    let students = getStudentsList();
    students = students.filter(s => s.rollNo !== rollNo);

    localStorage.setItem('adminStudentsList', JSON.stringify(students));
    loadAllStudents();

};


// ==========================================
// CSV BULK IMPORT FUNCTIONALITY
// ==========================================

function setupCsvImport() {

    const importBtn = document.getElementById('importCsvBtn');
    const fileInput = document.getElementById('csvFileInput');

    if (!importBtn || !fileInput) return;

    importBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {

        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const rows = parseCSV(text);
            const validStudents = [];

            for (const r of rows) {
                const parsed = extractStudentFromRow(r);
                if (parsed) validStudents.push(parsed);
            }

            if (validStudents.length === 0) {
                alert('⚠️ No valid student records found in this CSV.\nExpected columns: Roll Number, Name, Department, Year');
                return;
            }

            if (!confirm(`📥 Found ${validStudents.length} students in CSV file "${file.name}".\n\nDo you want to import them now?`)) {
                return;
            }

            importBtn.disabled = true;
            importBtn.textContent = 'Importing...';

            // 1. Sync to Supabase
            if (window.supabaseClient) {
                try {
                    const dbPayload = validStudents.map(s => ({
                        roll_number: s.rollNo,
                        name: s.name,
                        department: s.department,
                        year: s.year,
                        semester: '7th Semester',
                        section: 'A'
                    }));

                    const { error } = await window.supabaseClient
                        .from('students')
                        .upsert(dbPayload, { onConflict: 'roll_number' });

                    if (error) console.warn('[AdminStudents] Supabase CSV upsert warning:', error.message);
                } catch (sbErr) {
                    console.warn('[AdminStudents] Supabase CSV upsert error:', sbErr);
                }
            }

            // 2. Sync to local storage
            const currentList = getStudentsList();
            validStudents.forEach(newS => {
                const idx = currentList.findIndex(s => s.rollNo === newS.rollNo);
                if (idx >= 0) {
                    currentList[idx] = { ...currentList[idx], ...newS };
                } else {
                    currentList.push(newS);
                }
            });

            localStorage.setItem('adminStudentsList', JSON.stringify(currentList));

            alert(`✅ Successfully imported ${validStudents.length} students!`);
            loadAllStudents();

        } catch (err) {
            console.error('[AdminStudents] CSV parsing error:', err);
            alert('❌ Failed to parse CSV: ' + err.message);
        } finally {
            importBtn.disabled = false;
            importBtn.textContent = '📥 Import CSV';
        }

    });

}

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && !values[0])) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (values[idx] || '').trim();
        });
        rows.push(row);
    }
    return rows;
}

function parseCSVLine(text) {
    const values = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            values.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    values.push(cur);
    return values;
}

function extractStudentFromRow(row) {
    const roll = row['rollnumber'] || row['rollno'] || row['roll'] || row['id'] || '';
    const name = row['studentname'] || row['name'] || row['fullname'] || '';
    const dept = row['department'] || row['dept'] || 'CSE';
    const yr = row['year'] || '4th Year';

    if (!roll || !name) return null;
    return {
        rollNo: roll.toUpperCase(),
        roll_number: roll.toUpperCase(),
        name: name,
        department: dept,
        year: yr
    };
}


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
