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

    initializeDashboard();

});


// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

function initializeDashboard() {

    setupMenuButton();
    setupLogoutButton();
    loadDashboardData();

}


// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

function loadDashboardData() {

    // Get students list
    const students = getStudentsList();
    const totalStudents = students.length;

    // Get classes from localStorage
    const classList = JSON.parse(localStorage.getItem('classList')) || getDefaultClasses();
    const totalClasses = classList.length;

    // Get attendance data
    const attendanceData = getAttendanceData();
    const avgAttendance = calculateAverageAttendance(attendanceData, totalStudents);

    // Get pending leaves
    const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [
        { status: 'Pending' },
        { status: 'Pending' }
    ];
    const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending').length;

    // Update UI
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';
    document.getElementById('pendingLeaves').textContent = pendingLeaves;

}


// ==========================================
// GET STUDENTS LIST
// ==========================================

function getStudentsList() {

    const storedStudents = localStorage.getItem('adminStudentsList');
    if (storedStudents) {
        return JSON.parse(storedStudents);
    }

    // Default full student list
    const defaults = [
        { rollNo: "23RU1A0501", name: "A.D.SATHISH REDDY" },
        { rollNo: "23RU1A0502", name: "ADDAKULA SAJEEVA RANI" },
        { rollNo: "23RU1A0503", name: "ADIVISHNU HITENDRANAG" },
        { rollNo: "23RU1A0504", name: "AREKANTI NAVEEN KUMAR" },
        { rollNo: "23RU1A0505", name: "AYYAPPA REDDY YAMINI" },
        { rollNo: "23RU1A0506", name: "BANAGANI SREENATH" },
        { rollNo: "23RU1A0507", name: "BANALA MADHU" },
        { rollNo: "23RU1A0508", name: "BANAVATH MANTHESH NAIK" },
        { rollNo: "23RU1A0509", name: "BANDARU VASUDHA" },
        { rollNo: "23RU1A0510", name: "BANDI BHARGAVI" },
        { rollNo: "23RU1A0511", name: "BANDI KIRAN KUMAR" },
        { rollNo: "23RU1A0512", name: "BARIKI RAJU" },
        { rollNo: "23RU1A0513", name: "BATTA VENU" },
        { rollNo: "23RU1A0514", name: "BHOGAM MANOHAR" },
        { rollNo: "23RU1A0515", name: "BOGGARAPU NANDINI" },
        { rollNo: "23RU1A0516", name: "BOGYAM PRAVEEN KUMAR" },
        { rollNo: "23RU1A0517", name: "BOYA GOPAL" },
        { rollNo: "23RU1A0518", name: "BOYA VINOD" },
        { rollNo: "23RU1A0519", name: "BALGADEE JAGANMOHAN" },
        { rollNo: "23RU1A0520", name: "TARUN SAYIRAM" },
        { rollNo: "23RU1A0521", name: "CHAKALI USHARANI" },
        { rollNo: "23RU1A0522", name: "C BHARATH KUMAR REDDY" },
        { rollNo: "23RU1A0523", name: "CHALLA SAILIKHITHA" },
        { rollNo: "23RU1A0524", name: "C. BHARATHI" },
        { rollNo: "23RU1A0526", name: "DEVARA ANKITHA" },
        { rollNo: "23RU1A0527", name: "DUDEKULA JAMALBEE" },
        { rollNo: "23RU1A0528", name: "EERLA NAGAVENNELA" },
        { rollNo: "23RU1A0529", name: "GAJJI KURUBA MANOJ" },
        { rollNo: "23RU1A0530", name: "GANDIKOTA MANASA" },
        { rollNo: "23RU1A0531", name: "GOLLA MAHESH BABU" },
        { rollNo: "23RU1A0532", name: "GOSALA PUSHPANJALI" },
        { rollNo: "23RU1A0533", name: "GOTTIPADU DILIP KUMAR" },
        { rollNo: "23RU1A0534", name: "ILLURI SANDEEP VARDAN" },
        { rollNo: "23RU1A0535", name: "JUTLA GANESH" },
        { rollNo: "23RU1A0536", name: "JYOTHI AKSHAY" },
        { rollNo: "23RU1A0537", name: "KADIRI MADHUSAI" },
        { rollNo: "23RU1A0538", name: "KALLA RAGHU" },
        { rollNo: "23RU1A0539", name: "KANUGALLA HARITHA" },
        { rollNo: "23RU1A0540", name: "KANUKUNTLA KEERTHI" },
        { rollNo: "23RU1A0541", name: "KAPATALA GIRI NARASIMHA" },
        { rollNo: "23RU1A0542", name: "KONANGI DURGA RUPESH GOUD" },
        { rollNo: "23RU1A0543", name: "KOSIGI PARAMESH" },
        { rollNo: "23RU1A0544", name: "KUMMARI LAKSHMAN PRADEEP" },
        { rollNo: "23RU1A0545", name: "KUNDAVARAM SATHVIKA" },
        { rollNo: "23RU1A0546", name: "POOJITHA" },
        { rollNo: "23RU1A0547", name: "KURUVA ABHIMANYU" },
        { rollNo: "23RU1A0548", name: "KURAVA SHIVA PRASAD" },
        { rollNo: "23RU1A0549", name: "LAKKINENI AJITH" },
        { rollNo: "23RU1A0550", name: "LAKKIREDDY LAHARI" },
        { rollNo: "23RU1A0551", name: "LANKAYAPALLE RUPA" },
        { rollNo: "23RU1A0552", name: "M.SUMERA" },
        { rollNo: "23RU1A0553", name: "SUSMITHA. M" },
        { rollNo: "23RU1A0554", name: "M VIJAY RAJ" },
        { rollNo: "23RU1A0555", name: "MADIGA CHAITHANYA" },
        { rollNo: "23RU1A0556", name: "MADIGA GOVINDU" },
        { rollNo: "23RU1A0557", name: "MADIGA NAGESWARI" },
        { rollNo: "23RU1A0558", name: "MALA RAGHAVENDRA" },
        { rollNo: "23RU1A0559", name: "M.ASHOK" },
        { rollNo: "23RU1A0561", name: "MANCHALA GOWTHAM" },
        { rollNo: "23RU1A0562", name: "MANGALA DIVYA SREE" },
        { rollNo: "23RU1A0563", name: "MANGALA SAISANDHYA" },
        { rollNo: "23RU1A0564", name: "MARUPATI PAVAN" },
        { rollNo: "23RU1A0565", name: "MOHAMMED ASADULLAH" },
        { rollNo: "23RU1A0566", name: "MOLLA.HAFIZ RAHAMAN" },
        { rollNo: "23RU1A0567", name: "MOTA YUVA RAJU" },
        { rollNo: "23RU1A0568", name: "MUDDAM SHYAM SUNDAR" },
        { rollNo: "23RU1A0569", name: "MULINTI HARSHITHA" },
        { rollNo: "23RU1A0570", name: "MULUGURU VAMSI" },
        { rollNo: "23RU1A0571", name: "NADIMINTI TEJA" },
        { rollNo: "23RU1A0572", name: "PAIENTI LAKSHMI KANTHA REDDY" },
        { rollNo: "23RU1A0573", name: "PALAMARRI GNANA KUMAR" },
        { rollNo: "23RU1A0574", name: "PENKI RAMU" },
        { rollNo: "23RU1A0575", name: "PINJARI CHAND BASHA" },
        { rollNo: "23RU1A0576", name: "PINJARI ZUBEDA" },
        { rollNo: "23RU1A0577", name: "PITTU SREEVIDYA" },
        { rollNo: "23RU1A0578", name: "POTHU PALLAVI" },
        { rollNo: "23RU1A0579", name: "POTHULA SAKETH RAM" },
        { rollNo: "23RU1A0580", name: "PUJARI LAKSHMI LOKESH" },
        { rollNo: "23RU1A0581", name: "PUJARI MADHURI" },
        { rollNo: "23RU1A0582", name: "P.TEJASWINI" },
        { rollNo: "23RU1A0583", name: "SHAIK AFRID" },
        { rollNo: "23RU1A0585", name: "SHAIK ARSHAD" },
        { rollNo: "23RU1A0586", name: "SHAIK CARPENTER MOHAMMED REHAN" },
        { rollNo: "23RU1A0587", name: "SHAIK.MUJIBUR RAHEMAN" },
        { rollNo: "23RU1A0588", name: "SHAIK TAPAL UBEDULLAH" },
        { rollNo: "23RU1A0589", name: "SREENIVASULU GARI BALAJI" },
        { rollNo: "23RU1A0590", name: "SREERAMAPPAGARI MAHALAKSHMI" },
        { rollNo: "23RU1A0591", name: "TALARI KEERTHANA" },
        { rollNo: "23RU1A0592", name: "TELUGU HARSHITH" },
        { rollNo: "23RU1A0593", name: "THADAKARA MADHAN KUMAR" },
        { rollNo: "23RU1A0594", name: "THATHANA BOINA RAMPRASAD" },
        { rollNo: "23RU1A0595", name: "THOGATA YELLA NAGANANDINI" },
        { rollNo: "23RU1A0596", name: "THOTA RAJASIMHA" },
        { rollNo: "23RU1A0597", name: "TOTTARAMUDI RECHAL" },
        { rollNo: "23RU1A0598", name: "TUMMALAPENTA VENUGOPAL" },
        { rollNo: "23RU1A0599", name: "UDAYAGIRI NIKHILESWAR" },
        { rollNo: "23RU1A05A0", name: "UPPARA SRAVANTHI" },
        { rollNo: "23RU1A05A1", name: "UPPARA VENKATESWARI" },
        { rollNo: "23RU1A05A2", name: "V.KARTHIK" },
        { rollNo: "23RU1A05A3", name: "VADDE DANIEL" },
        { rollNo: "23RU1A05A4", name: "VAKKALAGADDA BALA BHARADWAJ" },
        { rollNo: "23RU1A05A5", name: "Y PRANAY KUMAR REDDY" },
        { rollNo: "23RU1A05A6", name: "YADAMALA HEMALATHA" },
        { rollNo: "23RU1A05A7", name: "MADIGA KRUPAVARAM" }
    ];

    return defaults;

}


// ==========================================
// GET DEFAULT CLASSES
// ==========================================

function getDefaultClasses() {

    return [
        { code: 'CSE-A', section: 'A', department: 'CSE', year: '4th Year', strength: 60 },
        { code: 'CSE-B', section: 'B', department: 'CSE', year: '4th Year', strength: 62 },
        { code: 'ECE-A', section: 'A', department: 'ECE', year: '4th Year', strength: 58 },
        { code: 'MECH-A', section: 'A', department: 'MECH', year: '4th Year', strength: 55 },
        { code: 'CIVIL-A', section: 'A', department: 'CIVIL', year: '4th Year', strength: 52 }
    ];

}


// ==========================================
// CALCULATE AVERAGE ATTENDANCE
// ==========================================

function calculateAverageAttendance(attendanceData, totalStudents) {

    let totalPresent = 0;
    let totalRecords = 0;

    for (const date in attendanceData) {

        const dayData = attendanceData[date];

        if (dayData.students) {

            for (const studentId in dayData.students) {

                const status = dayData.students[studentId];

                if (status === 'present') totalPresent++;

                totalRecords++;

            }

        }

    }

    if (totalRecords === 0) return 85; // Sensible default

    return Math.round((totalPresent / totalRecords) * 100);

}


// ==========================================
// GET ATTENDANCE DATA
// ==========================================

function getAttendanceData() {

    const attendanceData = {};

    // Scan localStorage for attendance records
    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key.startsWith('attendance_') && key !== 'attendance_records') {

            try {
                const data = JSON.parse(localStorage.getItem(key));
                attendanceData[key] = data;
            } catch (e) {
                // Ignore parse errors
            }

        }

    }

    return attendanceData;

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

    // Close sidebar when clicking outside
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
