import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { allQuestions, sheetHeaders } from "@/lib/survey";
import { authorisedResearcher } from "@/lib/supabase-server";
import { Participant } from "@/lib/types";

function rowFor(participant: Participant) {
  return [participant.id, participant.status, participant.hospital, participant.researcherEmail, participant.createdAt, participant.updatedAt,
    ...allQuestions.map((question) => { const value = participant.answers[question.id]; return Array.isArray(value) ? value.join(", ") : value || ""; }), participant.notes];
}

async function syncToSheets(participant: Participant) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) return;
  const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Web app responses";
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === sheetName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { frozenRowCount: 1 } } } }] } });
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${sheetName}'!A1`, valueInputOption: "RAW", requestBody: { values: [sheetHeaders] } });
  }
  const ids = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!A:A` });
  const rowIndex = ids.data.values?.findIndex((row) => row[0] === participant.id) ?? -1;
  const values = [rowFor(participant)];
  if (rowIndex >= 1) await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${sheetName}'!A${rowIndex + 1}`, valueInputOption: "RAW", requestBody: { values } });
  else await sheets.spreadsheets.values.append({ spreadsheetId, range: `'${sheetName}'!A:A`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values } });
}

export async function GET(request: NextRequest) {
  const auth = await authorisedResearcher(request);
  if (!auth) return NextResponse.json({ error: "Unauthorised researcher" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id")?.toUpperCase();
  if (!id) {
    const requestedPage = Number(request.nextUrl.searchParams.get("page") || "1");
    const requestedPageSize = Number(request.nextUrl.searchParams.get("pageSize") || "8");
    const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
    const pageSize = Number.isFinite(requestedPageSize) ? Math.min(50, Math.max(1, Math.floor(requestedPageSize))) : 8;
    const search = (request.nextUrl.searchParams.get("query") || "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
    const createdDate = request.nextUrl.searchParams.get("createdDate");
    const from = (page - 1) * pageSize;

    let query = auth.admin.from("participants")
      .select("id,hospital,status,researcher_email,answers,created_at,updated_at", { count: "exact" })
      .eq("researcher_email", auth.email);
    if (search) query = query.or(`id.ilike.%${search}%,hospital.ilike.%${search}%,status.ilike.%${search}%`);
    if (createdDate && /^\d{4}-\d{2}-\d{2}$/.test(createdDate)) {
      const nextDate = new Date(`${createdDate}T00:00:00.000Z`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      query = query.gte("created_at", `${createdDate}T00:00:00.000Z`).lt("created_at", nextDate.toISOString());
    }
    const { data, error, count } = await query.order("updated_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const participants = (data || []).map((row) => ({
      id: row.id,
      hospital: row.hospital,
      status: row.status,
      researcherEmail: row.researcher_email,
      answers: {},
      notes: "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      answeredCount: allQuestions.filter((question) => {
        const value = (row.answers || {})[question.id];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      }).length,
      isSummary: true,
    }));
    return NextResponse.json({ participants, total: count || 0, page, pageSize });
  }
  const { data, error } = await auth.admin.from("participants").select("*").eq("id", id).eq("researcher_email", auth.email).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  return NextResponse.json({ participant: { id: data.id, hospital: data.hospital, status: data.status, researcherEmail: data.researcher_email, answers: data.answers, notes: data.notes, createdAt: data.created_at, updatedAt: data.updated_at } });
}

export async function POST(request: Request) {
  const auth = await authorisedResearcher(request);
  if (!auth) return NextResponse.json({ error: "Unauthorised researcher" }, { status: 401 });
  const participant = (await request.json()) as Participant;
  if (!/^DOL-[A-Z0-9]{6}$/.test(participant.id)) return NextResponse.json({ error: "Invalid Research ID" }, { status: 400 });
  participant.researcherEmail = auth.email;
  const row = { id: participant.id, hospital: participant.hospital, status: participant.status, researcher_email: auth.email, answers: participant.answers, notes: participant.notes, created_at: participant.createdAt, updated_at: participant.updatedAt };
  const { error } = await auth.admin.from("participants").upsert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auth.admin.from("audit_log").insert({ participant_id: participant.id, researcher_email: auth.email, action: "saved" });
  try { await syncToSheets(participant); } catch (error) { console.error("Google Sheets sync failed", error); }
  return NextResponse.json({ ok: true, participantId: participant.id });
}
