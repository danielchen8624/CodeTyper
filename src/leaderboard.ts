// lib/leaderboard.ts
import { supabase } from "./lib/supabaseClient";

export type LeaderboardRow = {
  username: string;
  language: string;
  code_per_minute: number;
};

export async function fetchLeaderboard(
  limit = 50
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard_with_usernames")
    .select("username, language, code_per_minute")
    .order("code_per_minute", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return (data ?? []) as LeaderboardRow[];
}
