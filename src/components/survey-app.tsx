"use client";

import { useEffect, useMemo, useState } from "react";
import { isSameDay, parseISO } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  Check,
  CheckCircle,
  Cloud,
  CloudSlash as CloudOff,
  FileText,
  LockKey as LockKeyhole,
  MagnifyingGlass as Search,
  SignOut,
  UserPlus,
} from "@phosphor-icons/react";
import { createResearchId } from "@/lib/id";
import { allQuestions, surveySections } from "@/lib/survey";
import { getLocalParticipants, saveLocalParticipant } from "@/lib/store";
import { Participant } from "@/lib/types";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase-browser";
import { QuestionField } from "./question-field";
import { BarrierMatrix } from "./barrier-matrix";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DatePicker } from "./ui/date-picker";
import { Pagination } from "./ui/pagination";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

type Screen = "login" | "dashboard" | "survey" | "success";
type DashboardParticipant = Participant & { answeredCount?: number; isSummary?: boolean };
type Submission = { synced: boolean; detail: string };
type MessageTone = "error" | "pending" | "success";
const dashboardPageSize = 8;

export function SurveyApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [researchId, setResearchId] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [accessToken, setAccessToken] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("error");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(true);
  const [createdDate, setCreatedDate] = useState<Date>();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.email) {
        setEmail(data.session.user.email);
        setAccessToken(data.session.access_token);
        setScreen("dashboard");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.email) {
        setEmail(session.user.email);
        setAccessToken(session.access_token);
        setScreen("dashboard");
      } else {
        setAccessToken("");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (screen !== "dashboard" || !email || (hasSupabaseConfig() && !accessToken)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadDashboard(controller.signal), researchId || createdDate ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [screen, email, accessToken, currentPage, researchId, createdDate]);

  useEffect(() => setCurrentPage(1), [researchId, createdDate]);

  const completed = useMemo(() => {
    if (!participant) return 0;
    return allQuestions.filter((question) => {
      const value = participant.answers[question.id];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }).length;
  }, [participant]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("Enter a valid researcher email.");
      return;
    }
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase!.auth.signInWithOtp({ email: email.toLowerCase(), options: { emailRedirectTo: window.location.origin } });
      if (error) { setMessage(error.message); return; }
      setMessage("Check your email and open the secure sign-in link.");
      return;
    }
    sessionStorage.setItem("dolii-researcher", email.toLowerCase());
    setMessage("");
    setScreen("dashboard");
  }

  async function loadDashboard(signal: AbortSignal) {
    const query = researchId.trim().toLowerCase();
    const localRecords = getLocalParticipants()
      .filter((record) => record.researcherEmail === email.toLowerCase())
      .filter((record) => [record.id, record.hospital, record.status].some((value) => value.toLowerCase().includes(query)))
      .filter((record) => !createdDate || isSameDay(parseISO(record.createdAt), createdDate))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const localPage = localRecords.slice((currentPage - 1) * dashboardPageSize, currentPage * dashboardPageSize);

    setParticipants(localPage);
    setTotalParticipants(localRecords.length);
    setDashboardLoading(localPage.length === 0);

    if (!hasSupabaseConfig()) {
      setDashboardLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ page: String(currentPage), pageSize: String(dashboardPageSize) });
      if (researchId.trim()) params.set("query", researchId.trim());
      if (createdDate) params.set("createdDate", createdDate.toISOString().slice(0, 10));
      const response = await fetch(`/api/participants?${params}`, { signal, headers: { authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
      const data = await response.json() as { participants: DashboardParticipant[]; total: number };
      setParticipants(data.participants);
      setTotalParticipants(data.total);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) console.error(error);
    } finally {
      if (!signal.aborted) setDashboardLoading(false);
    }
  }

  async function signOut() {
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      await supabase?.auth.signOut();
    }
    sessionStorage.removeItem("dolii-researcher");
    setEmail("");
    setAccessToken("");
    setParticipants([]);
    setParticipant(null);
    setResearchId("");
    setMessage("");
    setScreen("login");
  }

  async function openParticipant(record: DashboardParticipant) {
    let fullRecord: Participant | undefined = record.isSummary ? undefined : record;
    if (record.isSummary && accessToken) {
      const response = await fetch(`/api/participants?id=${encodeURIComponent(record.id)}`, { headers: { authorization: `Bearer ${accessToken}` } });
      if (response.ok) fullRecord = (await response.json()).participant as Participant;
    }
    if (!fullRecord) fullRecord = getLocalParticipants().find((item) => item.id === record.id);
    if (!fullRecord) return;
    setParticipant(fullRecord);
    setSectionIndex(0);
    setMessage("");
    setScreen("survey");
  }

  function newParticipant() {
    const now = new Date().toISOString();
    const record: Participant = {
      id: createResearchId(),
      hospital: "Pentecost Hospital",
      status: "Initial interview",
      researcherEmail: email.toLowerCase(),
      answers: {},
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    saveLocalParticipant(record);
    setParticipant(record);
    setSectionIndex(0);
    setScreen("survey");
  }

  async function syncParticipant(record: Participant) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) throw new Error("The synchronization service is not configured.");

    let token = accessToken;
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || "";
    }

    const post = (bearer: string) => fetch("/api/participants", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${bearer}` },
      body: JSON.stringify(record),
    });

    let response = await post(token);
    if (response.status === 401) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) throw new Error("Your sign-in session has expired. Please sign in again.");
      token = data.session.access_token;
      setAccessToken(token);
      response = await post(token);
    }

    const result = await response.json().catch(() => ({ error: "The service returned an unreadable response." })) as { error?: string; sheetSync?: "synced" | "failed"; sheetError?: string };
    if (!response.ok) throw new Error(result.error || `Synchronization failed (${response.status}).`);
    return result;
  }

  async function saveParticipant(next = false) {
    if (!participant || saving) return;
    setSaving(true);
    setMessage("");
    const updated = { ...participant, updatedAt: new Date().toISOString() };
    saveLocalParticipant(updated);
    setParticipant(updated);

    let synced = false;
    let detail = "Saved on this device. Synchronization is pending.";
    if (online) {
      try {
        const result = await syncParticipant(updated);
        synced = true;
        detail = result.sheetSync === "failed"
          ? `Saved to the study database, but Google Sheets could not be updated: ${result.sheetError || "Unknown synchronization error"}`
          : "Saved to the study database and Google Sheets.";
      } catch (error) {
        detail = error instanceof Error ? error.message : "Synchronization failed. The record remains saved on this device.";
      }
    }

    setSaving(false);
    const isFinalSection = sectionIndex === surveySections.length - 1;
    if (isFinalSection) {
      setSubmission({ synced, detail });
      setScreen("success");
    } else {
      setMessage(synced ? "Saved and synchronized." : `Saved locally — ${detail}`);
      setMessageTone(synced ? "success" : "pending");
      if (next) setSectionIndex((index) => index + 1);
    }
  }

  async function retrySubmissionSync() {
    if (!participant || saving) return;
    setSaving(true);
    try {
      const result = await syncParticipant(participant);
      setSubmission({
        synced: true,
        detail: result.sheetSync === "failed"
          ? `Saved to the study database, but Google Sheets could not be updated: ${result.sheetError || "Unknown synchronization error"}`
          : "Saved to the study database and Google Sheets.",
      });
    } catch (error) {
      setSubmission({ synced: false, detail: error instanceof Error ? error.message : "Synchronization failed. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (screen === "login") {
    return (
      <main className="shell login-shell">
        <div className="brand-mark">D</div>
        <section className="login-card">
          <p className="eyebrow">Greater Accra maternity study</p>
          <h1>Continue the DOLII research survey</h1>
          <p className="lede">A secure workspace for authorised research staff. No participant names or contact details are collected.</p>
          <form onSubmit={login}>
            <label className="field-label" htmlFor="email">Researcher email</label>
            <InputGroup><InputGroupInput id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="researcher@example.com" autoComplete="email" /><InputGroupAddon><LockKeyhole size={19} /></InputGroupAddon></InputGroup>
            {message && <p className="inline-error">{message}</p>}
            <Button className="primary-button" type="submit">Continue <ArrowRight data-icon="inline-end" size={18} /></Button>
          </form>
          <p className="privacy-note">{hasSupabaseConfig() ? "We’ll email you a secure sign-in link. Only approved researcher emails can open study records." : "Development preview: connect Supabase to enforce the approved researcher list."}</p>
        </section>
      </main>
    );
  }

  if (screen === "success" && participant && submission) {
    return (
      <main className="shell completion-shell">
        <section className="completion-card" aria-labelledby="submission-title">
          <div className={`completion-icon ${submission.synced ? "synced" : "pending"}`}><CheckCircle size={34} weight="fill" /></div>
          <p className="eyebrow">Record saved</p>
          <h1 id="submission-title">Survey submission recorded</h1>
          <p className="completion-lede">The participant record is safe and can still be edited later.</p>
          <div className="completion-summary">
            <div><span>Research ID</span><strong>{participant.id}</strong></div>
            <div><span>Synchronization</span><Badge variant="outline" className={submission.synced ? "completion-synced" : "completion-pending"}>{submission.synced ? "Database saved" : "Pending"}</Badge></div>
          </div>
          <p className={`completion-detail ${submission.synced ? "success" : "pending"}`}>{submission.detail}</p>
          <div className="completion-actions">
            <Button variant="outline" onClick={() => { setSubmission(null); setScreen("survey"); }}>Continue editing</Button>
            <Button onClick={() => { setSubmission(null); setScreen("dashboard"); }}>Return to dashboard <ArrowRight data-icon="inline-end" size={18} /></Button>
          </div>
          {!submission.synced && <Button className="retry-sync-button" variant="ghost" disabled={saving || !online} onClick={retrySubmissionSync}>{saving ? "Retrying…" : online ? "Retry synchronization" : "Connect to the internet to retry"}</Button>}
        </section>
      </main>
    );
  }

  if (screen === "dashboard") {
    const totalPages = Math.max(1, Math.ceil(totalParticipants / dashboardPageSize));
    const safePage = Math.min(currentPage, totalPages);
    const hasFilters = Boolean(researchId.trim() || createdDate);
    return (
      <main className="shell dashboard-shell">
        <header className="topbar">
          <div><span className="mini-mark">D</span><strong>DOLII Survey</strong></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="user-menu-trigger" aria-label={`Researcher menu for ${email}`}>
                <span className="researcher-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span>
                <span className="researcher-name">{email}</span>
                <CaretDown className="user-menu-caret" size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="user-menu-panel" align="end">
              <DropdownMenuLabel className="user-menu-account"><p>Signed in as</p><span>{email}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}><SignOut size={17} /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div><h1>Your surveys</h1><p>Continue an existing record or begin a new participant survey.</p></div>
            <Button className="primary-button new-survey-button" onClick={newParticipant}><UserPlus data-icon="inline-start" size={19} /> New survey</Button>
          </div>
          <div className="dashboard-toolbar">
            <InputGroup className="dashboard-search"><InputGroupInput aria-label="Search surveys" value={researchId} onChange={(event) => setResearchId(event.target.value)} placeholder="Search Research ID, hospital, or status" /><InputGroupAddon><Search size={19} /></InputGroupAddon></InputGroup>
            <DatePicker date={createdDate} onChange={setCreatedDate} />
            <span>{totalParticipants} {totalParticipants === 1 ? "survey" : "surveys"}</span>
          </div>
          <div className="survey-table-card">
            {dashboardLoading ? <SurveyTableSkeleton /> : participants.length === 0 ? (
              <div className="dashboard-empty"><div className="empty-icon"><FileText size={25} /></div><h2>{hasFilters ? "No matching surveys" : "Your first survey starts here"}</h2><p>{hasFilters ? "Try a different Research ID, status, or creation date." : "Create a participant record now, then return here to continue it at follow-up."}</p>{!hasFilters && <Button className="secondary-button" variant="outline" onClick={newParticipant}><UserPlus data-icon="inline-start" size={18} /> Create first survey</Button>}</div>
            ) : (
              <Table><SurveyTableHeader /><TableBody>{participants.map((record) => {
                const answered = record.answeredCount ?? allQuestions.filter((question) => { const value = record.answers[question.id]; return Array.isArray(value) ? value.length > 0 : Boolean(value); }).length;
                return <TableRow key={record.id} onClick={() => openParticipant(record)}><TableCell><strong>{record.id}</strong></TableCell><TableCell>{record.hospital}</TableCell><TableCell><Badge variant="outline" className={`status-badge status-${record.status.toLowerCase().replaceAll(" ", "-")}`}>{record.status}</Badge></TableCell><TableCell>{Math.round((answered / allQuestions.length) * 100)}%</TableCell><TableCell>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(record.createdAt))}</TableCell><TableCell>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(record.updatedAt))}</TableCell><TableCell><Button className="row-action" variant="ghost" size="xs" onClick={(event) => { event.stopPropagation(); openParticipant(record); }}>Edit <ArrowRight data-icon="inline-end" size={15} /></Button></TableCell></TableRow>;
              })}</TableBody></Table>
            )}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </section>
      </main>
    );
  }

  if (!participant) return null;
  const section = surveySections[sectionIndex];
  const progress = Math.round((completed / allQuestions.length) * 100);

  return (
    <main className="survey-shell">
      <header className="survey-header">
        <Button className="icon-button" variant="outline" size="icon" aria-label="Back to surveys dashboard" onClick={() => setScreen("dashboard")}><ArrowLeft size={21} /></Button>
        <div><p>Research ID</p><strong>{participant.id}</strong></div>
        <Badge variant="outline" className={`sync-pill ${online ? "" : "offline"}`}>{online ? <Cloud data-icon="inline-start" size={16} /> : <CloudOff data-icon="inline-start" size={16} />}{saving ? "Saving" : online ? "Ready" : "Offline"}</Badge>
      </header>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="survey-layout">
        <aside className="section-nav">
          <div className="participant-summary"><span>{progress}%</span><p>Questionnaire answered</p></div>
          <nav>
            {surveySections.map((item, index) => (
              <Button key={item.id} variant="ghost" size="sm" className={index === sectionIndex ? "active" : ""} onClick={() => setSectionIndex(index)}>
                <span>{index < sectionIndex ? <Check size={15} /> : index + 1}</span>{item.shortTitle}
              </Button>
            ))}
          </nav>
        </aside>
        <section className="form-column">
          <div className="section-intro"><p className="eyebrow">Section {sectionIndex + 1} of {surveySections.length}</p><h1>{section.title}</h1><p>Answer what is available today. You can safely return to this record later.</p></div>
          {sectionIndex === 0 && (
            <article className="question-card study-fields">
              <div><label className="field-label">Hospital</label><select value={participant.hospital} onChange={(event) => setParticipant({ ...participant, hospital: event.target.value as Participant["hospital"] })}><option>Pentecost Hospital</option><option>Madina Polyclinic</option></select></div>
              <div><label className="field-label">Record status</label><select value={participant.status} onChange={(event) => setParticipant({ ...participant, status: event.target.value as Participant["status"] })}><option>Initial interview</option><option>Awaiting follow-up</option><option>Follow-up in progress</option><option>Complete</option></select></div>
            </article>
          )}
          {section.id === "f" ? (
            <BarrierMatrix questions={section.questions} answers={participant.answers} onChange={(id, value) => setParticipant({ ...participant, answers: { ...participant.answers, [id]: value } })} />
          ) : section.questions.map((question) => <QuestionField key={question.id} question={question} answers={participant.answers} onChange={(id, value) => setParticipant({ ...participant, answers: { ...participant.answers, [id]: value } })} />)}
          {sectionIndex === surveySections.length - 1 && <article className="question-card"><label className="field-label" htmlFor="notes">Research notes (no personal identifiers)</label><textarea id="notes" value={participant.notes} onChange={(event) => setParticipant({ ...participant, notes: event.target.value })} placeholder="Optional clinical or follow-up notes" /></article>}
          {message && <p className={`save-message ${messageTone}`}>{message}</p>}
          <footer className="form-actions">
            <Button className="secondary-button" variant="outline" disabled={saving || sectionIndex === 0} onClick={() => setSectionIndex((index) => Math.max(0, index - 1))}><ArrowLeft data-icon="inline-start" size={18} /> Previous</Button>
            <Button className="primary-button" disabled={saving} onClick={() => saveParticipant(true)}>{saving ? "Saving…" : sectionIndex === surveySections.length - 1 ? "Save record" : "Save & continue"}{!saving && <ArrowRight data-icon="inline-end" size={18} />}</Button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function SurveyTableHeader() {
  return <TableHeader><TableRow><TableHead>Research ID</TableHead><TableHead>Hospital</TableHead><TableHead>Status</TableHead><TableHead>Answered</TableHead><TableHead>Created</TableHead><TableHead>Last updated</TableHead><TableHead><span className="sr-only">Action</span></TableHead></TableRow></TableHeader>;
}

function SurveyTableSkeleton() {
  return (
    <Table aria-label="Loading surveys">
      <SurveyTableHeader />
      <TableBody>
        {Array.from({ length: 3 }, (_, row) => (
          <TableRow className="skeleton-table-row" key={row}>
            {[92, 130, 112, 38, 82, 82, 48].map((width, cell) => <TableCell key={cell}><Skeleton className="skeleton-line" style={{ width }} /></TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
