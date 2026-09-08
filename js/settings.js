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

    const savedStudent = localStorage.getItem('loggedInStudent');
    const savedAdmin = localStorage.getItem('loggedInAdmin');

    if (!savedStudent && !savedAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // If admin is logged in, redirect to admin page
    if (savedAdmin && !savedStudent) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // Initialize the page
    initializeSettingsPage();

});


// ==========================================
// INITIALIZE SETTINGS PAGE
// ==========================================

function initializeSettingsPage() {

    const student = JSON.parse(localStorage.getItem('loggedInStudent'));

    // Update user info
    document.getElementById('topStudentName').textContent = student.name;
    document.getElementById('topStudentRoll').textContent = student.rollNo;

    // Set up event listeners
    setupDarkModeToggle();
    setupPasswordForm();
    setupLogoutButtons();
    setupMobileMenu();

    // Apply saved dark mode setting
    applyDarkModeFromStorage();

}


// ==========================================
// DARK MODE FUNCTIONALITY
// ==========================================

function setupDarkModeToggle() {

    const toggle = document.getElementById('darkModeToggle');

    // Check if dark mode is enabled in localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    toggle.checked = isDarkMode;

    // Toggle dark mode on change
    toggle.addEventListener('change', function () {

        if (this.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }

    });

}

function enableDarkMode() {

    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('darkMode', 'true');

}

function disableDarkMode() {

    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('darkMode', 'false');

}

function applyDarkModeFromStorage() {

    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

}


// ==========================================
// PASSWORD CHANGE FUNCTIONALITY
// ==========================================

function setupPasswordForm() {

    const form = document.getElementById('passwordForm');

    // Setup password toggle buttons
    setupPasswordToggle('toggleCurrentPassword', 'currentPassword');
    setupPasswordToggle('toggleNewPassword', 'newPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    // Setup form submission
    form.addEventListener('submit', handlePasswordChange);

}

function setupPasswordToggle(buttonId, inputId) {

    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    button.addEventListener('click', function (e) {

        e.preventDefault();

        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }

    });

}

async function handlePasswordChange(e) {

    e.preventDefault();

    const student = JSON.parse(localStorage.getItem('loggedInStudent')) || {};

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageEl = document.getElementById('passwordMessage');

    // Validate new password length
    if (newPassword.length < 6) {
        showMessage(
            messageEl,
            '❌ New password must be at least 6 characters',
            'error'
        );
        return;
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
        showMessage(
            messageEl,
            '❌ New passwords do not match',
            'error'
        );
        return;
    }

    // Check if new password is same as old password
    if (newPassword === currentPassword) {
        showMessage(
            messageEl,
            '❌ New password must be different from current password',
            'error'
        );
        return;
    }

    // Check if Supabase session is active
    let supabaseSessionActive = false;
    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user) {
                supabaseSessionActive = true;
                const { error: updateErr } = await window.supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (updateErr) {
                    showMessage(
                        messageEl,
                        '❌ ' + (updateErr.message || 'Failed to update password.'),
                        'error'
                    );
                    return;
                }
            }
        } catch (sbErr) {
            console.warn('[Settings] Supabase password update warning:', sbErr);
        }
    }

    // If not using Supabase Auth session, validate with local stored password
    if (!supabaseSessionActive) {
        const storedPassword = getStudentPassword(student.rollNo);
        if (currentPassword !== storedPassword) {
            showMessage(
                messageEl,
                '❌ Current password is incorrect',
                'error'
            );
            return;
        }
    }

    // Save new password to local fallback as well
    if (student.rollNo) {
        saveStudentPassword(student.rollNo, newPassword);
    }

    // Show success message
    showMessage(
        messageEl,
        '✅ Password changed successfully!',
        'success'
    );

    // Reset form
    document.getElementById('passwordForm').reset();

    // Hide message after 3 seconds
    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = 'form-message';
    }, 3000);

}

function getStudentPassword(rollNo) {

    // Check if custom password is stored for this student
    const customPassword = localStorage.getItem(`password_${rollNo}`);

    if (customPassword) {
        return customPassword;
    }

    // Return default password if no custom password is set
    return 'student123';

}

function saveStudentPassword(rollNo, password) {

    localStorage.setItem(`password_${rollNo}`, password);

}

function showMessage(element, message, type) {

    element.textContent = message;
    element.className = `form-message ${type}`;

}


// ==========================================
// LOGOUT FUNCTIONALITY
// ==========================================

function setupLogoutButtons() {

    const sidebarLogoutBtn = document.getElementById('logoutButton');
    const confirmLogoutBtn = document.getElementById('logoutConfirmBtn');

    sidebarLogoutBtn.addEventListener('click', confirmLogout);
    confirmLogoutBtn.addEventListener('click', confirmLogout);

}

function confirmLogout() {

    const confirmDialog = confirm(
        '🚪 Are you sure you want to logout?\n\n' +
        'You will need to login again to access your dashboard.'
    );

    if (confirmDialog) {
        performLogout();
    }

}

function performLogout() {

    // Clear login data
    localStorage.removeItem('loggedInStudent');
    localStorage.removeItem('loggedInAdmin');

    // Redirect to login page
    window.location.href = 'index.html';

}


// ==========================================
// MOBILE MENU FUNCTIONALITY
// ==========================================

function setupMobileMenu() {

    const menuButton = document.getElementById('menuButton');
    const sidebar = document.getElementById('sidebar');

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
// UPDATE AUTH.JS TO USE STORED PASSWORDS
// Note: This function should be called from auth.js
// It retrieves the stored password if available
// ==========================================

function getStudentPasswordFromStorage(rollNo) {

    // Check if custom password is stored for this student
    const customPassword = localStorage.getItem(`password_${rollNo}`);

    if (customPassword) {
        return customPassword;
    }

    // Return default password if no custom password is set
    return 'student123';

}
