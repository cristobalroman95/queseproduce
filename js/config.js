// ── SUPABASE ──
const SUPABASE_URL = "https://vrcwsseyhpdtawpdgadt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dA8ubvxBKAqv_o-LCrz9FA_9zD1o1uk";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── DATA VERSION ──
const DATA_VERSION = "v11_2";
const DATA_VERSION_KEY = "qp_data_version";

// ── STORAGE BUCKET ──
const STORAGE_BUCKET = 'show-media';
const MAX_PHOTO_BYTES = 49 * 1024 * 1024; // 49 MB