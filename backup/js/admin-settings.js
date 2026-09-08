// ==========================================
// APPLY DARK MODE FROM STORAGE
// ==========================================

function applyDarkModeFromStorage() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
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

    initializeSettingsPage();

});


// ==========================================
// INITIALIZE SETTINGS PAGE
// ==========================================

function initializeSettingsPage() {

    setupMenuButton();
    setupDarkModeToggle();
    setupPasswordForm();
    setupLogoutButtons();

}


// ==========================================
// DARK MODE
// ==========================================

function setupDarkModeToggle() {

    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    toggle.checked = isDarkMode;

    toggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'false');
        }
    });

}


// ==========================================
// PASSWORD CHANGE
// ==========================================

function setupPasswordForm() {

    const form = document.getElementById('passwordForm');
    if (!form) return;

    setupPasswordToggle('toggleCurrentPassword', 'currentPassword');
    setupPasswordToggle('toggleNewPassword', 'newPassword');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const currentPass = document.getElementById('currentPassword').value.trim();
        const newPass = document.getElementById('newPassword').value.trim();
        const confirmPass = document.getElementById('confirmPassword').value.trim();
        const messageEl = document.getElementById('passwordMessage');

        const savedAdminPass = localStorage.getItem('adminPassword') || 'admin123';

        if (currentPass !== savedAdminPass) {
            messageEl.textContent = '❌ Current password is incorrect.';
            messageEl.className = 'form-message error';
            return;
        }

        if (newPass.length < 6) {
            messageEl.textContent = '❌ New password must be at least 6 characters.';
            messageEl.className = 'form-message error';
            return;
        }

        if (newPass !== confirmPass) {
            messageEl.textContent = '❌ New passwords do not match.';
            messageEl.className = 'form-message error';
            return;
        }

        if (newPass === currentPass) {
            messageEl.textContent = '❌ New password must be different from current password.';
            messageEl.className = 'form-message error';
            return;
        }

        localStorage.setItem('adminPassword', newPass);

        messageEl.textContent = '✅ Admin password updated successfully!';
        messageEl.className = 'form-message success';

        form.reset();

        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'form-message';
        }, 3000);
    });

}

function setupPasswordToggle(buttonId, inputId) {

    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!btn || !input) return;

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    });

}


// ==========================================
// LOGOUT BUTTONS
// ==========================================

function setupLogoutButtons() {

    const sidebarLogoutBtn = document.getElementById('logoutButton');
    const confirmLogoutBtn = document.getElementById('logoutConfirmBtn');

    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
    }
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }

}

function handleLogout() {

    if (confirm('🚪 Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInAdmin');
        localStorage.removeItem('loggedInStudent');
        window.location.href = 'index.html';
    }

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
