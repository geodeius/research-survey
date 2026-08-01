import { createClient } from "@supabase/supabase-js";

type ResearcherAuthFailure = {
  ok: false;
  status: 401 | 403 | 500 | 503;
  error: string;
};

type ResearcherAuthSuccess = {
  ok: true;
  admin: NonNullable<ReturnType<typeof createSupabaseAdmin>>;
  email: string;
  role: string;
};

export type ResearcherAuth = ResearcherAuthFailure | ResearcherAuthSuccess;

export function createSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authorisedResearcher(request: Request): Promise<ResearcherAuth> {
  const admin = createSupabaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin) {
    console.error("Supabase server configuration is incomplete.");
    return { ok: false, status: 503, error: "The database service is not configured on the server. Contact the study administrator." };
  }
  if (!token) return { ok: false, status: 401, error: "Your sign-in session is missing. Please sign in again." };

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user?.email) {
    console.error("Supabase access-token verification failed:", userError?.message || "Token has no email address.");
    return { ok: false, status: 401, error: "Your sign-in session could not be verified. Please sign out and sign in again." };
  }

  const email = user.email.toLowerCase();
  const { data, error } = await admin.from("researchers").select("email, active, role").eq("email", email).maybeSingle();
  if (error) {
    console.error("Researcher authorisation lookup failed:", error.message);
    return { ok: false, status: 500, error: "The researcher access list could not be checked. Contact the study administrator." };
  }
  if (!data?.active) {
    return { ok: false, status: 403, error: `${email} is not an active approved researcher. Ask the study administrator to add or activate this email.` };
  }

  return { ok: true, admin, email: data.email as string, role: data.role as string };
}
