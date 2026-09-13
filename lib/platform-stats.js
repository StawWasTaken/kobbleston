import { getSupabaseClient } from "./supabase/client";

// Table/column names below are placeholders matching the entities described
// in the project brief (profiles, spaces, space_visits, space_updates).
// Adjust them once the real schema is finalized — search this file for
// every `.from(...)` call if a table gets renamed.

const EMPTY_STATS = {
  accounts: 0,
  publishedSpaces: 0,
  totalVisits: 0,
  totalUpdates: 0,
  available: false,
};

export async function getPlatformStats() {
  const supabase = getSupabaseClient();
  if (!supabase) return EMPTY_STATS;

  try {
    const [accounts, publishedSpaces, visits, updates] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("spaces")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabase.from("space_visits").select("id", { count: "exact", head: true }),
      supabase.from("space_updates").select("id", { count: "exact", head: true }),
    ]);

    return {
      accounts: accounts.count ?? 0,
      publishedSpaces: publishedSpaces.count ?? 0,
      totalVisits: visits.count ?? 0,
      totalUpdates: updates.count ?? 0,
      available: true,
    };
  } catch (error) {
    console.error("Failed to load platform stats:", error);
    return EMPTY_STATS;
  }
}

export async function getRecentActivity(limit = 6) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("activity_events")
      .select("id, type, actor_name, space_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Failed to load recent activity:", error);
    return [];
  }
}

export function subscribeToActivity(onInsert) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel("activity_events_public")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "activity_events" },
      (payload) => onInsert(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
