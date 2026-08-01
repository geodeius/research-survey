import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authorisedResearcher(request: Request) {
  const admin = createSupabaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user?.email) return null;
  const { data } = await admin.from("researchers").select("email, active, role").eq("email", user.email.toLowerCase()).eq("active", true).maybeSingle();
  return data ? { admin, email: data.email as string, role: data.role as string } : null;
}
