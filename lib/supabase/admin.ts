import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using service role key.
 * ONLY use this for server-side operations that need to bypass RLS.
 * NEVER import this file in client-side code.
 * The SUPABASE_SERVICE_ROLE_KEY must NOT be prefixed with NEXT_PUBLIC_.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "This should only be available on the server in production."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
