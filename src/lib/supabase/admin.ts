import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Service-role client. NEVER import this from a Client Component — the
 * `server-only` import above makes any accidental client-side import a
 * build error. Used for admin-only operations Data API RLS can't express,
 * like reading auth.users emails via the Admin API.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
