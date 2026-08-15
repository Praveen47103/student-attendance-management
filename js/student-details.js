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
// CHECK LOGIN
// ==========================================

const savedStudent = localStorage.getItem("loggedInStudent");
const savedAdmin = localStorage.getItem("loggedInAdmin");


// If neither student nor admin is logged in
// send them back to login page

if (!savedStudent && !savedAdmin) {

    window.location.href = "index.html";

}


// If admin is logged in, redirect to admin page

if (savedAdmin && !savedStudent) {

    window.location.href = "admin-dashboard.html";

}


// Convert saved data back into object

const student = JSON.parse(savedStudent);


// ==========================================
// STUDENT INFORMATION
// ==========================================

// Top bar student name

document.getElementById("topStudentName").textContent =
    student.name;


// Top bar roll number

document.getElementById("topStudentRoll").textContent =
    student.rollNo;


// ==========================================
// PROFILE HEADER
// ==========================================

document.getElementById("profileName").textContent =
    student.name;


document.getElementById("profileRoll").textContent =
    "Roll Number: " + student.rollNo;


document.getElementById("profileDept").textContent =
    "Department: " + (student.department || "CSE");


document.getElementById("profileYear").textContent =
    student.year || "4th Year";


document.getElementById("profileSem").textContent =
    student.semester || "7th Semester";


// ==========================================
// PERSONAL INFORMATION
// ==========================================

document.getElementById("fullName").textContent =
    student.name;


document.getElementById("rollNum").textContent =
    student.rollNo;


document.getElementById("dob").textContent =
    "January 15, 2002";


document.getElementById("gender").textContent =
    "Male";


document.getElementById("idNum").textContent =
    "12345678901234";


// ==========================================
// CONTACT INFORMATION
// ==========================================

document.getElementById("email").textContent =
    student.name.toLowerCase().replace(/\s+/g, '.') + "@college.edu";


document.getElementById("phone").textContent =
    "+91 9876543210";


document.getElementById("address").textContent =
    "123 Main Street, City, State";


document.getElementById("city").textContent =
    "Hyderabad";


document.getElementById("postal").textContent =
    "500001";


// ==========================================
// ACADEMIC INFORMATION
// ==========================================

document.getElementById("degree").textContent =
    "Bachelor of Technology";


document.getElementById("dept").textContent =
    student.department || "Computer Science & Engineering";


document.getElementById("year").textContent =
    student.year || "4th Year";


document.getElementById("sem").textContent =
    student.semester || "7th Semester";


document.getElementById("institution").textContent =
    "ABC Engineering College";


document.getElementById("cgpa").textContent =
    "8.2/10";


document.getElementById("attendance").textContent =
    "82%";


document.getElementById("admissionDate").textContent =
    "August 15, 2021";


document.getElementById("batch").textContent =
    "2021-2025";


// ==========================================
// EMERGENCY CONTACT
// ==========================================

document.getElementById("emergencyName").textContent =
    "Jane Doe";


document.getElementById("emergencyRelation").textContent =
    "Mother";


document.getElementById("emergencyPhone").textContent =
    "+91 9876543211";


document.getElementById("emergencyEmail").textContent =
    "jane.doe@email.com";


// ==========================================
// SUBJECTS/COURSES
// ==========================================

const subjects = [

    {
        name: "Web Technologies",
        code: "CS401",
        credits: 4
    },

    {
        name: "Computer Networks",
        code: "CS402",
        credits: 4
    },

    {
        name: "Machine Learning",
        code: "CS403",
        credits: 4
    },

    {
        name: "Cloud Computing",
        code: "CS404",
        credits: 4
    },

    {
        name: "Software Engineering",
        code: "CS405",
        credits: 4
    },

    {
        name: "Database Management",
        code: "CS406",
        credits: 4
    },

    {
        name: "Operating Systems",
        code: "CS407",
        credits: 4
    },

    {
        name: "Cryptography",
        code: "CS408",
        credits: 4
    }

];


// ==========================================
// DISPLAY SUBJECTS
// ==========================================

const subjectsGrid =
    document.getElementById("subjectsGrid");


subjects.forEach(function (subject) {

    const subjectCard = document.createElement("div");
    subjectCard.className = "subject-card";

    subjectCard.innerHTML = `

        <div class="subject-header">
            <h4>${subject.name}</h4>
            <span class="subject-code">${subject.code}</span>
        </div>

        <div class="subject-info">
            <span class="info-badge">
                📚 ${subject.credits} Credits
            </span>
        </div>

    `;

    subjectsGrid.appendChild(subjectCard);

});


// ==========================================
// LOGOUT
// ==========================================

document
    .getElementById("logoutButton")
    .addEventListener("click", function () {


        // Remove student login

        localStorage.removeItem(
            "loggedInStudent"
        );


        // Remove admin login if available

        localStorage.removeItem(
            "loggedInAdmin"
        );


        // Go to login page

        window.location.href =
            "index.html";

    });


// ==========================================
// MOBILE MENU
// ==========================================

const menuButton =
    document.getElementById("menuButton");


const sidebar =
    document.getElementById("sidebar");


menuButton.addEventListener(
    "click",
    function () {

        sidebar.classList.toggle("show");

    }
);


// ==========================================
// CLOSE MOBILE MENU WHEN LINK CLICKED
// ==========================================

const navLinks =
    document.querySelectorAll(".nav-link");


navLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            sidebar.classList.remove("show");

        }
    );

});
