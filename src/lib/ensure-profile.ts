import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the current user has a profile record.
 * This handles the case where a user registered before the trigger was set up.
 * Returns the user ID or throws if not authenticated.
 */
export async function ensureProfile(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nepřihlášen");

  // Check if profile exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Create profile if it doesn't exist
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
    });
    if (error && error.code !== "23505") {
      // 23505 = unique violation (race condition, profile already exists)
      throw new Error(`Nepodařilo se vytvořit profil: ${error.message}`);
    }
  }

  return user.id;
}
