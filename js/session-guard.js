// ==========================================
// SESSION GUARD & ROLE-BASED ACCESS CONTROL
// ==========================================
// Prevents unauthorized URL access between Student and Admin portals.
// Verifies cryptographic session with Supabase Auth.

(function () {
    'use strict';

    function getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    }

    function isAdminPage() {
        const page = getCurrentPage();
        return page.startsWith('admin-') || page === 'admin.html';
    }

    function isStudentPage() {
        const page = getCurrentPage();
        return [
            'students.html',
            'attendance.html',
            'calendar.html',
            'reports.html',
            'student-details.html',
            'leave.html',
            'settings.html'
        ].includes(page);
    }

    /**
     * Verifies the user session against Supabase Auth.
     */
    async function enforceSessionGuard() {
        const page = getCurrentPage();
        if (page === 'index.html' || page === '') {
            return; // Login page handles its own state
        }

        // Wait a tick if client is still initializing
        if (!window.supabaseClient && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            await new Promise(r => setTimeout(r, 100));
        }

        // 1. Try Supabase cryptographic session check
        if (window.supabaseClient) {
            try {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();

                if (!error && session && session.user) {
                    // Query user's assigned role from public.profiles
                    const { data: profile } = await window.supabaseClient
                        .from('profiles')
                        .select('id, role, full_name, email')
                        .eq('id', session.user.id)
                        .single();

                    const role = profile?.role || 'student';

                    // Guard: Block students from admin pages
                    if (isAdminPage() && role !== 'admin') {
                        console.error('[SessionGuard] Security violation: Non-admin attempted to access admin page.');
                        alert('⛔ Access Denied: Administrator permissions required.');
                        window.location.href = 'students.html';
                        return;
                    }

                    // Guard: If admin visits student page without student profile
                    if (isStudentPage() && role === 'admin' && !localStorage.getItem('loggedInStudent')) {
                        console.info('[SessionGuard] Admin visiting student page. Redirecting to admin dashboard.');
                        window.location.href = 'admin-dashboard.html';
                        return;
                    }

                    // Store verified profile in memory/cache
                    window.currentUserProfile = profile;
                    window.currentAuthUser = session.user;
                    return; // Successfully verified via Supabase Auth
                }
            } catch (err) {
                console.warn('[SessionGuard] Supabase session check error, checking fallback:', err);
            }
        }

        // 2. Fallback check: localStorage demo accounts
        const savedStudent = localStorage.getItem('loggedInStudent');
        const savedAdmin = localStorage.getItem('loggedInAdmin');

        if (isAdminPage()) {
            if (!savedAdmin) {
                console.warn('[SessionGuard] Unauthorized admin page access. Redirecting to login.');
                cleanupAndRedirect();
                return;
            }
        } else if (isStudentPage()) {
            if (!savedStudent && !savedAdmin) {
                console.warn('[SessionGuard] Unauthorized student page access. Redirecting to login.');
                cleanupAndRedirect();
                return;
            }
        }
    }

    function cleanupAndRedirect() {
        localStorage.removeItem('loggedInStudent');
        localStorage.removeItem('loggedInAdmin');
        window.location.href = 'index.html';
    }

    /**
     * Unified secure logout function
     */
    window.handleSecureLogout = async function () {
        if (!confirm('🚪 Are you sure you want to logout?')) {
            return;
        }

        try {
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
            }
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            cleanupAndRedirect();
        }
    };

    // Attach listeners to logout buttons across pages
    document.addEventListener('DOMContentLoaded', function () {
        const logoutBtns = document.querySelectorAll('#logoutButton, #logoutBtn, #logoutConfirmBtn');
        logoutBtns.forEach(btn => {
            // Replace click handler with secure logout
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.handleSecureLogout();
            }, true);
        });

        // Run guard
        enforceSessionGuard();
    });

})();
