# DOLII Research Survey

Browser-based, longitudinal questionnaire for the study **Delayed Onset of Lactogenesis II among Mothers Who Delivered by Caesarean Section in Selected Hospitals in Greater Accra**.

## Included

- Passwordless researcher email sign-in with an approval list
- Automatic non-identifying Research IDs (`DOL-XXXXXX`)
- Search and reopen participant records by Research ID
- Seven staged questionnaire sections covering questions 1–75
- Save incomplete interviews and continue them later
- Responsive phone and laptop layouts
- Local draft fallback during interrupted connectivity
- Supabase participant database and audit log
- Automatic upsert to a dedicated `Web app responses` tab in the existing Google Sheet
- Existing `Form responses 1` data remains untouched
- Agentation visual feedback overlay during local desktop development

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and populate the values before testing live authentication or synchronization.

During local development, Agentation appears in the bottom-right corner on desktop. Use it to click an interface element, attach feedback, and copy structured annotations for Codex. It is excluded from production builds and does not appear to researchers.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add the two approved researcher emails to `public.researchers`.
4. Enable passwordless email authentication.
5. Add the site URL and localhost URL to the Supabase authentication redirect allow-list.
6. Put the project URL, anonymous key, and service-role key in `.env.local`.

The browser receives only the public anonymous key. The service-role key remains on the server.

## Google Sheets setup

1. Create a Google Cloud service account with Google Sheets API access.
2. Share the `DOLII (Responses)` spreadsheet with the service-account email as an editor.
3. Add the service-account email and private key to the deployment environment.
4. Keep `GOOGLE_SHEET_ID` set to `1ZODFn9prlCLZXG4TDylTNV7nFNtjEF6fCYl8GlduZFM`.

The application creates and maintains a separate `Web app responses` tab. It updates records by Research ID, preventing repeat visits from creating duplicate rows.

## Deployment

Deploy to Vercel and add the same environment variables in the project settings. After deployment, add the production URL to the Supabase redirect allow-list.

## Privacy

Do not enter names, telephone numbers, addresses, hospital record numbers, or other direct identifiers in the research-notes field. Treat the coded dataset as sensitive health research data.
