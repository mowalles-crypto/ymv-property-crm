import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/domain";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return profile;
}

/** Redirects to /login if unauthenticated, otherwise returns the profile. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Redirects non-admins to /client/home. Use at the top of admin pages. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/client/home");
  return profile;
}

/** Redirects non-clients (i.e. admins) to /admin/dashboard. */
export async function requireClient(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "client") redirect("/admin/dashboard");
  return profile;
}
