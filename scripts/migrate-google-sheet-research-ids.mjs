import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SHEET_ID",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);

let privateKey = process.env.GOOGLE_PRIVATE_KEY.trim();
if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, "\n");

const database = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: migrations, error } = await database.from("research_id_migrations").select("old_id,new_id");
if (error) throw new Error(`Could not read Research ID mappings: ${error.message}`);

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME || "Web app responses";
const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!A:A` });
const rows = data.values || [];
const rowById = new Map(rows.map((row, index) => [row[0], index + 1]));
const updates = (migrations || [])
  .filter((migration) => rowById.has(migration.old_id))
  .map((migration) => ({
    range: `'${sheetName}'!A${rowById.get(migration.old_id)}`,
    values: [[migration.new_id]],
  }));

if (updates.length) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data: updates },
  });
}

console.log(`Updated ${updates.length} Google Sheets Research ID${updates.length === 1 ? "" : "s"}.`);
