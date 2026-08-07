export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  siteUrl:
    process.env.NEXT_PUBLIC_SAPLING_SITE_URL?.trim() ??
    "http://localhost:3000",
};

export const hasSupabase = Boolean(
  publicEnv.supabaseUrl && publicEnv.supabasePublishableKey,
);

