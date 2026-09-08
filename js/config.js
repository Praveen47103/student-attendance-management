// ==========================================
// SUPABASE CLIENT CONFIGURATION
// ==========================================
// IMPORTANT SECURITY RULES:
// 1. NEVER put the `service_role` secret key in this file.
// 2. Only use the public `anon` (publishable) key here.
// 3. This key is safe to be exposed in frontend JavaScript when Row Level Security (RLS) is enabled.
// 4. In Supabase Dashboard, find this under: Project Settings -> API -> Project API Keys (anon public).

const SUPABASE_CONFIG = {
    // Supabase Project URL
    url: "https://onsjogeerbffmmiblzca.supabase.co",

    // Paste your public Publishable/anon key below (starts with eyJhbGciOi...)
    anonKey: "sb_publishable_RagkgF85BH8AlAGfvmVNHA_HI8sK3J9"
};

// Helper to check if Supabase is properly configured
function isSupabaseConfigured() {
    return (
        SUPABASE_CONFIG.url &&
        SUPABASE_CONFIG.url !== "YOUR_SUPABASE_URL" &&
        SUPABASE_CONFIG.url.startsWith("https://") &&
        SUPABASE_CONFIG.anonKey &&
        SUPABASE_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY" &&
        SUPABASE_CONFIG.anonKey.trim() !== ""
    );
}
