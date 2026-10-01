export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  siteUrl:
    process.env.NEXT_PUBLIC_SAPLING_SITE_URL?.trim() ??
    "http://localhost:3000",
};

// Demo mode keeps learners in the browser (no sign-in, local progress) but
// still reads and writes the shared speech clips, so lines made while testing
// are kept for everyone.
export const demoMode = process.env.NEXT_PUBLIC_SAPLING_DEMO?.trim() === "1";

const supabaseConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabasePublishableKey);

// Learners, sign-in and progress live in Supabase.
export const hasSupabase = supabaseConfigured && !demoMode;

// The shared speech bucket is reachable, demo or not.
export const hasSpeechStore = supabaseConfigured;

