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

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const currentPass = document.getElementById('currentPassword').value.trim();
        const newPass = document.getElementById('newPassword').value.trim();
        const confirmPass = document.getElementById('confirmPassword').value.trim();
        const messageEl = document.getElementById('passwordMessage');

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

        // Purge any legacy device-specific password in localStorage
        localStorage.removeItem('adminPassword');

        // Supabase Auth password update (Single Source of Truth)
        if (window.supabaseClient && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            try {
                const { data: { session }, error: sessionErr } = await window.supabaseClient.auth.getSession();

                if (sessionErr || !session || !session.user) {
                    messageEl.textContent = '❌ Active Supabase Admin session required. Please log out and sign in with your Admin credentials.';
                    messageEl.className = 'form-message error';
                    return;
                }

                // Call Supabase Auth API to update user password
                const { error: updateErr } = await window.supabaseClient.auth.updateUser({
                    password: newPass
                });

                if (updateErr) {
                    messageEl.textContent = '❌ ' + (updateErr.message || 'Failed to update admin password in Supabase Auth.');
                    messageEl.className = 'form-message error';
                    return;
                }

                messageEl.textContent = '✅ Admin password securely updated in Supabase Auth! (Synchronized across all devices)';
                messageEl.className = 'form-message success';
                form.reset();

                setTimeout(() => {
                    messageEl.textContent = '';
                    messageEl.className = 'form-message';
                }, 4000);
                return;
            } catch (sbErr) {
                console.error('[AdminSettings] Supabase password update error:', sbErr);
                messageEl.textContent = '❌ Error updating password: ' + (sbErr.message || 'Network error');
                messageEl.className = 'form-message error';
                return;
            }
        }

        // Demo fallback only if Supabase is unconfigured
        messageEl.textContent = 'ℹ️ Supabase not configured. Password update is disabled in local demo mode.';
        messageEl.className = 'form-message';
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
