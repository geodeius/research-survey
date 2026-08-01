"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Cloud, CloudOff, LockKeyhole, Search, UserPlus } from "lucide-react";
import { createResearchId, normalizeResearchId } from "@/lib/id";
import { allQuestions, surveySections } from "@/lib/survey";
import { getLocalParticipants, saveLocalParticipant } from "@/lib/store";
import { Participant } from "@/lib/types";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase-browser";
import { QuestionField } from "./question-field";

type Screen = "login" | "lookup" | "survey";

export function SurveyApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [researchId, setResearchId] = useState("");
  const [participant, setParticipant] = useState<Participant | null>(null);
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
        setScreen("lookup");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.email) {
        setEmail(session.user.email);
        setScreen("lookup");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
    setScreen("lookup");
  }

  async function findParticipant(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeResearchId(researchId);
    let found = getLocalParticipants().find((record) => record.id === normalized);
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase!.auth.getSession();
      const response = await fetch(`/api/participants?id=${encodeURIComponent(normalized)}`, { headers: { authorization: `Bearer ${session?.access_token || ""}` } });
      if (response.ok) found = (await response.json()).participant as Participant;
    }
    if (!found) {
      setMessage("No participant was found with that Research ID.");
      return;
    }
    setParticipant(found);
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
            <button className="primary-button" type="submit">Continue <ArrowRight size={18} /></button>
          </form>
          <p className="privacy-note">{hasSupabaseConfig() ? "We’ll email you a secure sign-in link. Only approved researcher emails can open study records." : "Development preview: connect Supabase to enforce the approved researcher list."}</p>
        </section>
      </main>
    );
  }

  if (screen === "lookup") {
    return (
      <main className="shell lookup-shell">
        <header className="topbar"><div><span className="mini-mark">D</span><strong>DOLII Survey</strong></div><span className="researcher">{email}</span></header>
        <section className="lookup-panel">
          <p className="eyebrow">Participant records</p>
          <h1>Who are you recording today?</h1>
          <p className="lede">Enter the Research ID exactly as shown in the study log.</p>
          <form onSubmit={findParticipant} className="lookup-form">
            <label className="field-label" htmlFor="researchId">Research ID</label>
            <div className="input-with-icon research-input"><Search size={20} /><input id="researchId" value={researchId} onChange={(event) => setResearchId(normalizeResearchId(event.target.value))} placeholder="DOL-XXXXXX" /></div>
            {message && <p className="inline-error">{message}</p>}
            <button className="primary-button" type="submit">Open questionnaire <ArrowRight size={18} /></button>
          </form>
          <div className="or-divider"><span>or</span></div>
          <button className="secondary-button" onClick={newParticipant}><UserPlus size={19} /> Register new participant</button>
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
        <button className="icon-button" aria-label="Back to participant search" onClick={() => setScreen("lookup")}><ArrowLeft size={21} /></button>
        <div><p>Research ID</p><strong>{participant.id}</strong></div>
        <div className={`sync-pill ${online ? "" : "offline"}`}>{online ? <Cloud size={16} /> : <CloudOff size={16} />}{saving ? "Saving" : online ? "Ready" : "Offline"}</div>
      </header>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="survey-layout">
        <aside className="section-nav">
          <div className="participant-summary"><span>{progress}%</span><p>Questionnaire answered</p></div>
          <nav>
            {surveySections.map((item, index) => (
              <button key={item.id} className={index === sectionIndex ? "active" : ""} onClick={() => setSectionIndex(index)}>
                <span>{index < sectionIndex ? <Check size={15} /> : index + 1}</span>{item.shortTitle}
              </button>
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
          {section.questions.map((question) => <QuestionField key={question.id} question={question} answers={participant.answers} onChange={(id, value) => setParticipant({ ...participant, answers: { ...participant.answers, [id]: value } })} />)}
          {sectionIndex === surveySections.length - 1 && <article className="question-card"><label className="field-label" htmlFor="notes">Research notes (no personal identifiers)</label><textarea id="notes" value={participant.notes} onChange={(event) => setParticipant({ ...participant, notes: event.target.value })} placeholder="Optional clinical or follow-up notes" /></article>}
          {message && <p className="save-message">{message}</p>}
          <footer className="form-actions">
            <button className="secondary-button" disabled={sectionIndex === 0} onClick={() => setSectionIndex((index) => Math.max(0, index - 1))}><ArrowLeft size={18} /> Previous</button>
            <button className="primary-button" onClick={() => saveParticipant(true)}>{sectionIndex === surveySections.length - 1 ? "Save record" : "Save & continue"}<ArrowRight size={18} /></button>
          </footer>
        </section>
      </div>
    </main>
  );
}
