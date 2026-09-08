// ==========================================
// SUPABASE CLIENT INITIALIZER & CONNECTION TESTER
// ==========================================
// Requires official Supabase JS SDK:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// and js/config.js to be loaded prior to this script.

(function () {
    'use strict';

    window.supabaseClient = null;

    /**
     * Initializes the Supabase client instance.
     */
    function initClient() {
        if (typeof window.supabase === 'undefined') {
            console.warn(
                '[Supabase] Supabase JS library not loaded. Include CDN script:\n' +
                '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
            );
            return null;
        }

        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured()) {
            console.info(
                '[Supabase] Waiting for valid Anon Key in "js/config.js".\n' +
                'Current Project URL: ' + (typeof SUPABASE_CONFIG !== 'undefined' ? SUPABASE_CONFIG.url : 'not set')
            );
            return null;
        }

        try {
            window.supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );

            console.log('[Supabase] Client initialized for project: ' + SUPABASE_CONFIG.url);

            // Automatically verify connection in background
            window.testSupabaseConnection();

            return window.supabaseClient;
        } catch (err) {
            console.error('[Supabase] Failed to initialize client:', err);
            return null;
        }
    }

    /**
     * Tests the live connection to Supabase without requiring existing tables.
     */
    window.testSupabaseConnection = async function () {
        if (!window.supabaseClient) {
            console.warn('[Supabase Test] Cannot test connection: client is not initialized. Check js/config.js.');
            return { success: false, message: 'Client not initialized. Check js/config.js.' };
        }

        try {
            // auth.getSession() tests connectivity and verifies the anon key without requiring any database tables
            const { data, error } = await window.supabaseClient.auth.getSession();

            if (error) {
                console.error('❌ [Supabase Test] Connection error:', error.message);
                return { success: false, error: error.message };
            }

            console.log('✅ [Supabase Test] Connection verified successfully! Connected to project: ' + SUPABASE_CONFIG.url);
            return { success: true, message: 'Connected to Supabase successfully.' };
        } catch (networkErr) {
            console.error('❌ [Supabase Test] Network error:', networkErr);
            return { success: false, error: networkErr.message || 'Network error' };
        }
    };

    // Auto initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClient);
    } else {
        initClient();
    }
})();
