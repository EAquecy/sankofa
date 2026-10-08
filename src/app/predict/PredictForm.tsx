"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = ["Reading past papers…", "Measuring how often each topic repeats…", "Checking chief examiner remarks…", "Writing likely questions…", "Preparing marking guides…"];

export default function PredictForm({ subjects, credits, role }: { subjects: { id: number; name: string; years: number }[]; credits: number; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState<{ text: string; credits?: boolean } | null>(null);
  const [kind, setKind] = useState<"practice" | "mock">("practice");
  const [subject, setSubject] = useState(subjects.find((s) => s.years > 0)?.id ?? subjects[0]?.id);
  const year = new Date().getFullYear();
  const sel = subjects.find((s) => s.id === subject);

  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr(null); setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 12000);
    try {
      const r = await fetch("/api/ai/predict", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject_id: subject, target_year: Number(f.get("year")), kind, num_questions: Number(f.get("num")), focus: f.get("focus") }) });
      const j = await r.json().catch(() => ({ error: "The agent took too long. Try fewer questions." }));
      if (!r.ok) { setErr({ text: j.error, credits: j.code === "credits" }); return; }
      router.push(`/predict/${j.id}`);
    } finally { clearInterval(t); setBusy(false); }
  }

  return (
    <form onSubmit={go} className="panel space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="h-sec">Generate a paper</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${credits > 0 ? "bg-gold/20 text-text" : "bg-redpen/10 text-redpen"}`}>{credits} credit{credits === 1 ? "" : "s"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([["practice", "Practice set"], ["mock", "Mock exam"]] as const).map(([k, l]) => (
          <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={`rounded-md border px-3 py-2 text-sm font-semibold ${kind === k ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{l}</button>
        ))}
      </div>
      <div><label className="label">Subject</label>
        <select className="input" value={subject} onChange={(e) => setSubject(Number(e.target.value))}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.years ? ` (${s.years} years of papers)` : " (no papers yet)"}</option>)}
        </select>
        {sel && sel.years === 0 && <p className="hint text-redpen">No past papers for this subject yet, so the agent has nothing to analyse.</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="label">Exam year</label><input name="year" type="number" min={year - 1} max={year + 3} defaultValue={year + (new Date().getMonth() > 6 ? 1 : 0)} className="input" /></div>
        <div><label className="label">Questions</label><select name="num" defaultValue={kind === "mock" ? 12 : 8} key={kind} className="input">{[5, 8, 10, 12, 15, 20].map((n) => <option key={n}>{n}</option>)}</select></div>
      </div>
      <div><label className="label">Focus (optional)</label><input name="focus" className="input" placeholder={role === "teacher" ? "e.g. Paper 2 Section B only, or organic chemistry" : "e.g. topics I always fail: vectors, probability"} /></div>
      {err && <p className="text-sm text-redpen">{err.text}{err.credits && " Ask the Sankofa team to top up your credits."}</p>}
      <button className="btn-primary w-full" disabled={busy || credits < 1 || !sel?.years}>{busy ? STAGES[stage] : "Generate paper (1 credit)"}</button>
      {busy && <p className="hint text-center">This usually takes 1–2 minutes. Keep this page open.</p>}
    </form>
  );
}
