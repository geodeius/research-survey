"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  Check,
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

type Screen = "login" | "dashboard" | "survey";

export function SurveyApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [researchId, setResearchId] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(true);

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
        setScreen("dashboard");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.email) {
        setEmail(session.user.email);
        setScreen("dashboard");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (screen !== "dashboard" || !email) return;
    void loadDashboard();
  }, [screen, email]);

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

  async function loadDashboard() {
    setDashboardLoading(true);
    let records = getLocalParticipants().filter((record) => record.researcherEmail === email.toLowerCase());
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch("/api/participants", { headers: { authorization: `Bearer ${session?.access_token || ""}` } });
      if (response.ok) records = (await response.json()).participants as Participant[];
    }
    setParticipants(records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setDashboardLoading(false);
  }

  async function signOut() {
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      await supabase?.auth.signOut();
    }
    sessionStorage.removeItem("dolii-researcher");
    setEmail("");
    setParticipants([]);
    setParticipant(null);
    setResearchId("");
    setMessage("");
    setScreen("login");
  }

  function openParticipant(record: Participant) {
    setParticipant(record);
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

  async function saveParticipant(next = false) {
    if (!participant) return;
    setSaving(true);
    const updated = { ...participant, updatedAt: new Date().toISOString() };
    saveLocalParticipant(updated);
    setParticipant(updated);
    if (online) {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
        const response = await fetch("/api/participants", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token || ""}` },
          body: JSON.stringify(updated),
        });
        if (!response.ok && response.status !== 503) throw new Error("sync failed");
      } catch {
        setMessage("Saved on this device. It will need to be synchronized when the service is connected.");
      }
    }
    setSaving(false);
    if (next && sectionIndex < surveySections.length - 1) setSectionIndex((index) => index + 1);
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
            <div className="input-with-icon"><LockKeyhole size={19} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="researcher@example.com" autoComplete="email" /></div>
            {message && <p className="inline-error">{message}</p>}
            <Button className="primary-button" type="submit">Continue <ArrowRight data-icon="inline-end" size={18} /></Button>
          </form>
          <p className="privacy-note">{hasSupabaseConfig() ? "We’ll email you a secure sign-in link. Only approved researcher emails can open study records." : "Development preview: connect Supabase to enforce the approved researcher list."}</p>
        </section>
      </main>
    );
  }

  if (screen === "dashboard") {
    const normalizedQuery = researchId.trim().toLowerCase();
    const visibleParticipants = participants.filter((record) =>
      [record.id, record.hospital, record.status].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
    return (
      <main className="shell dashboard-shell">
        <header className="topbar">
          <div><span className="mini-mark">D</span><strong>DOLII Survey</strong></div>
          <details className="user-menu">
            <summary aria-label={`Researcher menu for ${email}`}>
              <span className="researcher-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span>
              <span className="researcher-name">{email}</span>
              <CaretDown className="user-menu-caret" size={14} />
            </summary>
            <div className="user-menu-panel">
              <p>Signed in as</p>
              <span>{email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}><SignOut data-icon="inline-start" size={17} /> Sign out</Button>
            </div>
          </details>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div><h1>Your surveys</h1><p>Continue an existing record or begin a new participant survey.</p></div>
            <Button className="primary-button new-survey-button" onClick={newParticipant}><UserPlus data-icon="inline-start" size={19} /> New survey</Button>
          </div>
          <div className="dashboard-toolbar">
            <div className="input-with-icon dashboard-search"><Search size={19} /><input aria-label="Search surveys" value={researchId} onChange={(event) => setResearchId(event.target.value)} placeholder="Search Research ID, hospital, or status" /></div>
            <span>{participants.length} {participants.length === 1 ? "survey" : "surveys"}</span>
          </div>
          <div className="survey-table-card">
            {dashboardLoading ? <div className="dashboard-state"><span className="loading-dot" /> Loading your surveys…</div> : visibleParticipants.length === 0 ? (
              <div className="dashboard-empty"><div className="empty-icon"><FileText size={25} /></div><h2>{participants.length ? "No matching surveys" : "Your first survey starts here"}</h2><p>{participants.length ? "Try a different Research ID or status." : "Create a participant record now, then return here to continue it at follow-up."}</p>{!participants.length && <Button className="secondary-button" variant="outline" onClick={newParticipant}><UserPlus data-icon="inline-start" size={18} /> Create first survey</Button>}</div>
            ) : (
              <div className="table-scroll"><table><thead><tr><th>Research ID</th><th>Hospital</th><th>Status</th><th>Answered</th><th>Last updated</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{visibleParticipants.map((record) => {
                const answered = allQuestions.filter((question) => { const value = record.answers[question.id]; return Array.isArray(value) ? value.length > 0 : Boolean(value); }).length;
                return <tr key={record.id} onClick={() => openParticipant(record)}><td><strong>{record.id}</strong></td><td>{record.hospital}</td><td><Badge variant="outline" className={`status-badge status-${record.status.toLowerCase().replaceAll(" ", "-")}`}>{record.status}</Badge></td><td>{Math.round((answered / allQuestions.length) * 100)}%</td><td>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(record.updatedAt))}</td><td><Button className="row-action" variant="ghost" size="xs" onClick={(event) => { event.stopPropagation(); openParticipant(record); }}>Edit <ArrowRight data-icon="inline-end" size={15} /></Button></td></tr>;
              })}</tbody></table></div>
            )}
          </div>
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
          {message && <p className="save-message">{message}</p>}
          <footer className="form-actions">
            <Button className="secondary-button" variant="outline" disabled={sectionIndex === 0} onClick={() => setSectionIndex((index) => Math.max(0, index - 1))}><ArrowLeft data-icon="inline-start" size={18} /> Previous</Button>
            <Button className="primary-button" onClick={() => saveParticipant(true)}>{sectionIndex === surveySections.length - 1 ? "Save record" : "Save & continue"}<ArrowRight data-icon="inline-end" size={18} /></Button>
          </footer>
        </section>
      </div>
    </main>
  );
}
