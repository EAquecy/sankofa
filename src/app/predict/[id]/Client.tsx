"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";
import { localInputToISO } from "@/lib/utils";

const LIKE: Record<string, string> = { "very high": "bg-redpen text-white", high: "bg-gold text-text", medium: "bg-line text-text" };

export function QuestionCard({ q, showAnswers }: { q: any; showAnswers: boolean }) {
  const [open, setOpen] = useState<"why" | "guide" | null>(null);
  return (
    <article className="panel break-inside-avoid p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-lg font-bold">Q{q.number}</span>
        <span className="chip">{q.topic}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${LIKE[q.likelihood] ?? "bg-line"}`}>{q.likelihood} likelihood</span>
        <span className="ml-auto text-sm text-muted">[{q.marks} marks]</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-[1rem] leading-relaxed">{q.question}</p>
      <div className="mt-4 flex gap-3 text-sm print:hidden">
        <button onClick={() => setOpen(open === "why" ? null : "why")} className="font-semibold text-ink hover:underline" aria-expanded={open === "why"}>Why it's likely</button>
        {showAnswers && <button onClick={() => setOpen(open === "guide" ? null : "guide")} className="font-semibold text-ink hover:underline" aria-expanded={open === "guide"}>Marking guide</button>}
      </div>
      {open === "why" && <p className="mt-3 rounded-md bg-paper p-3 text-sm">{q.rationale}{q.evidence_years?.length ? ` (Evidence: ${q.evidence_years.join(", ")})` : ""}</p>}
      {open === "guide" && <p className="mt-3 whitespace-pre-line rounded-md border-l-4 border-redpen bg-redpen/5 p-3 text-sm">{q.marking_guide}</p>}
    </article>
  );
}

export function PrintButton() {
  return <button onClick={() => window.print()} className="btn-ghost">Print or save as PDF</button>;
}

export function SendToClass({ prediction, classrooms }: { prediction: any; classrooms: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"exercise" | "mock">(prediction.kind === "mock" ? "mock" : "exercise");
  const { busy, error, run } = useMutate();
  const router = useRouter();
  if (!open) return <button onClick={() => setOpen(true)} className="btn-primary">Send to a classroom</button>;
  const total = (prediction.questions ?? []).reduce((a: number, q: any) => a + (q.marks || 0), 0) || 100;
  const text = (prediction.questions ?? []).map((q: any) => `Question ${q.number} [${q.marks} marks]\n${q.question}`).join("\n\n");
  return (
    <form className="panel mt-2 w-full space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      const cid = String(f.get("classroom")); const due = String(f.get("due") || "");
      run(() => createClient().from("assignments").insert({
        classroom_id: cid, title: String(f.get("title")), instructions: text, kind, max_score: total, prediction_id: prediction.id,
        duration_minutes: kind === "mock" ? Number(f.get("duration")) : null, due_at: due ? localInputToISO(due) : null,
      }) as any, () => router.push(`/classroom/${cid}?tab=classwork`));
    }}>
      <h3 className="h-sec">Send to a classroom</h3>
      <div className="grid grid-cols-2 gap-2">
        {([["exercise", "Assignment"], ["mock", "Timed mock exam"]] as const).map(([k, l]) => (
          <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={`rounded-md border px-3 py-2 text-sm font-semibold ${kind === k ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{l}</button>
        ))}
      </div>
      <div><label className="label">Classroom</label><select name="classroom" className="input">{classrooms.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      <div><label className="label">Title</label><input name="title" required className="input" defaultValue={`${kind === "mock" ? "Mock" : "Predicted questions"}: ${prediction.subjects?.name} WASSCE ${prediction.target_year}`} /></div>
      <div className="grid grid-cols-2 gap-2">
        {kind === "mock" && <div><label className="label">Time allowed</label><select name="duration" defaultValue={120} className="input">{[30, 60, 90, 120, 150, 180].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hr` : `${m} min`}</option>)}</select></div>}
        <div><label className="label">Due (optional)</label><input name="due" type="datetime-local" className="input" /></div>
      </div>
      <p className="hint">Students see the questions only. The marking guide stays with you.</p>
      {error && <p className="text-sm text-redpen">{error}</p>}
      <div className="flex gap-2"><button className="btn-primary" disabled={busy}>Post to students</button><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}
