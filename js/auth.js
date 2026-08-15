// ==========================================
// STUDENT DATA
// ==========================================

const students = [
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


// ==========================================
// DEFAULT STUDENT PASSWORD
// ==========================================

const STUDENT_PASSWORD = "student123";


// ==========================================
// ADMIN LOGIN DETAILS
// ==========================================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const loginType = document.getElementById("loginType");

const studentLogin = document.getElementById("studentLogin");
const adminLogin = document.getElementById("adminLogin");

const rollNumber = document.getElementById("rollNumber");
const studentPassword = document.getElementById("studentPassword");

const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");

const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


// ==========================================
// CHANGE LOGIN TYPE
// STUDENT / ADMIN
// ==========================================

loginType.addEventListener("change", function () {

    loginMessage.textContent = "";

    if (loginType.value === "student") {

        studentLogin.classList.remove("hidden");
        adminLogin.classList.add("hidden");

    } else {

        studentLogin.classList.add("hidden");
        adminLogin.classList.remove("hidden");

    }

});


// ==========================================
// STUDENT PASSWORD SHOW / HIDE
// ==========================================

document
    .getElementById("studentPasswordToggle")
    .addEventListener("click", function () {

        if (studentPassword.type === "password") {

            studentPassword.type = "text";
            this.textContent = "🙈";

        } else {

            studentPassword.type = "password";
            this.textContent = "👁️";

        }

    });


// ==========================================
// ADMIN PASSWORD SHOW / HIDE
// ==========================================

document
    .getElementById("adminPasswordToggle")
    .addEventListener("click", function () {

        if (adminPassword.type === "password") {

            adminPassword.type = "text";
            this.textContent = "🙈";

        } else {

            adminPassword.type = "password";
            this.textContent = "👁️";

        }

    });


// ==========================================
// LOGIN BUTTON
// ==========================================

loginButton.addEventListener("click", function () {

    if (loginType.value === "student") {

        studentLoginFunction();

    } else {

        adminLoginFunction();

    }

});


// ==========================================
// STUDENT LOGIN FUNCTION
// ==========================================

function studentLoginFunction() {

    const enteredRollNo = rollNumber.value.trim().toUpperCase();
    const enteredPassword = studentPassword.value.trim();


    // Empty field check

    if (enteredRollNo === "" || enteredPassword === "") {

        showMessage(
            "Please enter roll number and password.",
            "red"
        );

        return;
    }


    // Find student
    const allStudents = JSON.parse(localStorage.getItem("adminStudentsList")) || students;

    const student = allStudents.find(function (s) {
        const rNo = s.rollNo || s.rollNumber || "";
        return rNo.toUpperCase() === enteredRollNo;
    });


    // Roll number not found

    if (!student) {

        showMessage(
            "Invalid roll number.",
            "red"
        );

        return;
    }


    // Password check
    // Check for stored password first, then fall back to default

    const roll = student.rollNo || student.rollNumber;
    const storedPassword = localStorage.getItem(`password_${roll}`);
    const validPassword = storedPassword || STUDENT_PASSWORD;

    if (enteredPassword !== validPassword) {

        showMessage(
            "Incorrect password.",
            "red"
        );

        return;
    }


    // ==========================================
    // LOGIN SUCCESS
    // ==========================================

    const loggedInStudent = {

         rollNo: roll,
         name : student.name || student.studentName,
         department: student.department || "CSE",
         year: student.year || "4th Year",
         semester: student.semester || "7th Semester",
         loginType: "student"

    };


    // Save student information

    localStorage.setItem(
        "loggedInStudent",
        JSON.stringify(loggedInStudent)
    );


    showMessage(
        "Login successful! Welcome " + loggedInStudent.name,
        "green"
    );


    // Redirect

    setTimeout(function () {

        window.location.href = "students.html";

    }, 1000);

}


// ==========================================
// ADMIN LOGIN FUNCTION
// ==========================================

function adminLoginFunction() {

    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();


    // Empty field check

    if (username === "" || password === "") {

        showMessage(
            "Please enter username and password.",
            "red"
        );

        return;
    }


    // Check admin details (check stored password or default)
    const validAdminPassword = localStorage.getItem("adminPassword") || ADMIN_PASSWORD;

    if (
        username === ADMIN_USERNAME &&
        password === validAdminPassword
    ) {


        // Save admin login

        localStorage.setItem(
            "loggedInAdmin",
            "true"
        );


        showMessage(
            "Admin login successful!",
            "green"
        );


        // Redirect

        setTimeout(function () {

            window.location.href = "admin-dashboard.html";

        }, 1000);


    } else {

        showMessage(
            "Invalid admin username or password.",
            "red"
        );

    }

}


// ==========================================
// LOGIN MESSAGE
// ==========================================

function showMessage(message, color) {

    loginMessage.textContent = message;

    loginMessage.style.color = color;

}


// ==========================================
// ENTER KEY LOGIN
// ==========================================

document.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        loginButton.click();

    }

});

