import { NextResponse } from "next/server";
import { authorisedResearcher } from "@/lib/supabase-server";
import { Participant } from "@/lib/types";

const hospitalCodes: Record<Participant["hospital"], string> = {
  "Pentecost Hospital": "P",
  "Madina Polyclinic": "M",
};

export async function POST(request: Request) {
  const auth = await authorisedResearcher(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null) as { hospital?: Participant["hospital"] } | null;
  const hospital = body?.hospital;
  if (!hospital || !hospitalCodes[hospital]) return NextResponse.json({ error: "Select a valid hospital." }, { status: 400 });

  const { data, error } = await auth.admin.rpc("next_research_id", { hospital_code: hospitalCodes[hospital] });
  if (error) return NextResponse.json({ error: `Research ID allocation failed: ${error.message}` }, { status: 500 });
  if (typeof data !== "string") return NextResponse.json({ error: "Research ID allocation returned an invalid value." }, { status: 500 });

  return NextResponse.json({ id: data });
}
