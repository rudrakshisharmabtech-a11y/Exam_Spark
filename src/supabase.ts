import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  demo?: boolean;
  profile?: {
    rollNumber?: string;
    section?: string;
    githubProfile?: string | null;
  } | null;
};

export async function exchangeSupabaseSession(
  accessToken: string,
  role: "student" | "teacher" | "admin",
  profile?: { name?: string; rollNumber?: string; section?: string; githubProfile?: string },
) {
  let response: Response;
  try {
    response = await fetch("/api/auth/supabase-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ role, ...profile }),
    });
  } catch {
    throw new Error("Cannot reach the ExamSpark API. Start `pnpm server:dev` and verify the MySQL configuration.");
  }
  const text = await response.text();
  let result: { user?: AuthenticatedUser; error?: string } = {};
  if (text) {
    try {
      result = JSON.parse(text) as typeof result;
    } catch {
      throw new Error(
        `The sign-in API returned an unexpected response (HTTP ${response.status}). Start \`pnpm server:dev\` and check MySQL.`,
      );
    }
  }
  if (!response.ok || !result.user) {
    throw new Error(result.error || "Could not connect your account to ExamSpark.");
  }
  return result.user;
}
