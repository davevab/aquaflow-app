// Supabase Configuration for AquaFlow
const SUPABASE_URL = 'https://objfqhffofsrttjxswkx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8kUVR1zO703wEgv1je_wtQ_88YK988G';

// Initialize Supabase client (will be available in all apps)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to format dates for Supabase
function formatDateForDB(date) {
    return new Date(date).toISOString().split('T')[0];
}

// Helper function to generate order reference number
function generateOrderRef() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `AQF-${timestamp}-${random}`;
}
