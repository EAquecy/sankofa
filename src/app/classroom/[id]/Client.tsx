"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";
import { localInputToISO } from "@/lib/utils";

const sb = () => createClient();
async function uid() { return (await sb().auth.getUser()).data.user!.id; }
async function upload(classroomId: string, file: File | null) {
  if (!file || !file.size) return null;
  if (file.size > 20 * 1024 * 1024) throw new Error("File is larger than 20 MB.");
  const path = `${classroomId}/${await uid()}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const { error } = await sb().storage.from("classwork").upload(path, file);
  if (error) throw error;
  return path;
}
const Err = ({ e }: { e: string | null }) => (e ? <p className="text-sm text-redpen">{e}</p> : null);

export function CopyCode({ code }: { code: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="rounded-md border border-dashed border-ink/40 bg-white px-3 font-display font-bold tracking-wider text-ink" title="Copy code">
      {ok ? "Copied" : code}
    </button>
  );
}

export function DeleteRow({ table, id, label, small }: { table: string; id: string; label: string; small?: boolean }) {
  const { busy, run } = useMutate();
  return <button disabled={busy} className={small ? "text-xs text-muted hover:text-redpen" : "btn-danger btn-sm"}
    onClick={() => confirm(`${label}? This can't be undone.`) && run(() => sb().from(table).delete().eq("id", id) as any)}>{label}</button>;
}

export function NewSession({ classroomId, topics, defaultUrl }: any) {
  const { busy, error, run, setError } = useMutate();
  const [mins, setMins] = useState(90);
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault();
      const form = e.currentTarget; const f = new FormData(form);
      const start = new Date(localInputToISO(String(f.get("start"))));
      if (start.getTime() < Date.now()) return setError("Pick a time in the future.");
      run(() => sb().from("class_sessions").insert({
        classroom_id: classroomId, title: String(f.get("title")), topic_id: f.get("topic") || null,
        starts_at: start.toISOString(), ends_at: new Date(start.getTime() + mins * 60000).toISOString(),
        meeting_url: String(f.get("url") || "") || null, notes: String(f.get("notes") || "") || null,
      }) as any, () => form.reset());
    }}>
      <h2 className="h-sec">Schedule a class</h2>
      <div><label className="label">Title</label><input name="title" required className="input" placeholder="e.g. Acids, bases and salts" /></div>
      <div><label className="label">Topic from lesson path</label>
        <select name="topic" className="input"><option value="">None</option>{topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div><label className="label">Starts (Accra time)</label><input name="start" type="datetime-local" required className="input" /></div>
        <div><label className="label">Length</label>
          <select className="input" value={mins} onChange={(e) => setMins(Number(e.target.value))}>
            {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hr`}</option>)}
          </select></div>
      </div>
      <p className="hint -mt-1">Classes are capped at 2 hours.</p>
      <div><label className="label">Google Meet or Zoom link</label><input name="url" type="url" defaultValue={defaultUrl ?? ""} className="input" placeholder="https://meet.google.com/…" /></div>
      <div><label className="label">Note for students (optional)</label><input name="notes" className="input" placeholder="Bring your calculator" /></div>
      <Err e={error} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Scheduling…" : "Schedule and notify students"}</button>
    </form>
  );
}

export function TopicForm({ classroomId, nextPos }: any) {
  const { busy, error, run } = useMutate();
  return (
    <form className="panel h-fit space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      run(() => sb().from("topics").insert({ classroom_id: classroomId, position: nextPos, title: String(f.get("title")), strand: String(f.get("strand") || "") || null, description: String(f.get("description") || "") }) as any, () => form.reset());
    }}>
      <h2 className="h-sec">Add a topic</h2>
      <div><label className="label">Topic</label><input name="title" required className="input" placeholder="e.g. Quadratic equations" /></div>
      <div><label className="label">Syllabus strand or section</label><input name="strand" className="input" placeholder="e.g. Strand 2: Algebra" /></div>
      <div><label className="label">What students will learn</label><textarea name="description" rows={3} className="input" /></div>
      <Err e={error} />
      <button className="btn-primary w-full" disabled={busy}>Add topic</button>
    </form>
  );
}

export function TopicControls({ topic, prev, next }: any) {
  const { busy, run } = useMutate();
  const swap = (o: any) => run(async () => {
    const s = sb();
    const a = await s.from("topics").update({ position: o.position }).eq("id", topic.id);
    if (a.error) return a;
    return s.from("topics").update({ position: topic.position === o.position ? o.position + 1 : topic.position }).eq("id", o.id);
  });
  return (
    <div className="flex shrink-0 items-start gap-1">
      <button disabled={busy || !prev} onClick={() => swap(prev)} className="btn-ghost btn-sm px-2" aria-label="Move up">↑</button>
      <button disabled={busy || !next} onClick={() => swap(next)} className="btn-ghost btn-sm px-2" aria-label="Move down">↓</button>
      <button disabled={busy} onClick={() => run(() => sb().from("topics").update({ is_covered: !topic.is_covered }).eq("id", topic.id) as any)} className="btn-ghost btn-sm">{topic.is_covered ? "Undo" : "Covered"}</button>
      <DeleteRow table="topics" id={topic.id} label="Delete" small />
    </div>
  );
}

export function AskQuestion({ classroomId, topics }: any) {
  const { busy, error, run } = useMutate();
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      run(async () => sb().from("questions").insert({ classroom_id: classroomId, author_id: await uid(), topic_id: f.get("topic") || null, body: String(f.get("body")) }), () => form.reset());
    }}>
      <label className="label" htmlFor="qbody">Ask a question</label>
      <textarea id="qbody" name="body" required minLength={3} rows={3} className="input" placeholder="What didn't make sense? Be specific, e.g. 'Why do we change the sign when dividing an inequality by a negative number?'" />
      <div className="flex flex-wrap gap-2">
        <select name="topic" className="input w-auto flex-1"><option value="">Any topic</option>{topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        <button className="btn-primary" disabled={busy}>Post question</button>
      </div>
      <Err e={error} />
    </form>
  );
}

export function AnswerForm({ questionId, isOwner }: { questionId: string; isOwner: boolean }) {
  const { busy, error, run } = useMutate();
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="mt-3 text-sm font-semibold text-ink hover:underline">{isOwner ? "Answer as teacher" : "Suggest an answer"}</button>;
  return (
    <form className="mt-3 space-y-2" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      run(async () => sb().from("answers").insert({ question_id: questionId, author_id: await uid(), body: String(f.get("body")) }), () => { form.reset(); setOpen(false); });
    }}>
      <textarea name="body" required rows={3} autoFocus className="input" placeholder={isOwner ? "Your explanation will be shared with every student in this classroom." : "Explain how you'd solve it"} />
      <div className="flex gap-2"><button className="btn-primary btn-sm" disabled={busy}>Post answer</button><button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button></div>
      <Err e={error} />
    </form>
  );
}

export function MockGate({ id, minutes, text }: { id: string; minutes: number; text: string }) {
  const key = "mock-start-" + id;
  const read = () => { try { return Number(localStorage.getItem(key)) || null; } catch { return null; } };
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setStart(read()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!start) return (
    <div className="mt-4 rounded-md border border-dashed border-redpen/40 bg-redpen/5 p-4">
      <p className="text-sm">This is a timed mock exam. You'll have <b>{minutes} minutes</b> once you start. Find a quiet place and have your materials ready.</p>
      <button className="btn-primary btn-sm mt-3" onClick={() => { const t = Date.now(); try { localStorage.setItem(key, String(t)); } catch {} setStart(t); }}>Start mock exam</button>
    </div>
  );
  const left = Math.max(0, start + minutes * 60000 - now);
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return (
    <div className="mt-3">
      <div className={`sticky top-20 z-10 mb-3 inline-block rounded-md px-3 py-1.5 font-display text-lg font-bold tabular-nums ${left === 0 ? "bg-redpen text-white" : left < 600000 ? "bg-gold" : "bg-ink text-white"}`}>
        {left === 0 ? "Time's up. Submit now." : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} left`}
      </div>
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}

export function NewAssignment({ classroomId, topics }: any) {
  const { busy, error, run } = useMutate();
  const [mock, setMock] = useState(false);
  return (
    <form className="panel h-fit space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      run(async () => {
        const path = await upload(classroomId, f.get("file") as File);
        const due = String(f.get("due") || "");
        return sb().from("assignments").insert({
          classroom_id: classroomId, title: String(f.get("title")), instructions: String(f.get("instructions") || ""),
          topic_id: f.get("topic") || null, due_at: due ? localInputToISO(due) : null, max_score: Number(f.get("max") || 100), attachment_path: path,
          kind: mock ? "mock" : "exercise", duration_minutes: mock ? Number(f.get("duration")) : null,
        });
      }, () => form.reset());
    }}>
      <h2 className="h-sec">Upload questions</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} className="h-4 w-4 accent-[#1b2a6b]" /> Timed mock exam</label>
      {mock && <div><label className="label">Time allowed</label><select name="duration" defaultValue={120} className="input">{[30, 60, 90, 120, 150, 180].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hr` : `${m} min`}</option>)}</select></div>}
      <div><label className="label">Title</label><input name="title" required className="input" placeholder="e.g. WASSCE 2019 Paper 2, Q1–5" /></div>
      <div><label className="label">Questions or instructions</label><textarea name="instructions" rows={5} className="input" /></div>
      <div><label className="label">Question sheet (optional)</label><input name="file" type="file" accept=".pdf,.doc,.docx,image/*" className="input" /><p className="hint">PDF, Word or photo, up to 20 MB.</p></div>
      <div><label className="label">Topic</label><select name="topic" className="input"><option value="">None</option>{topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
      <div className="grid grid-cols-[1fr_6rem] gap-2">
        <div><label className="label">Due (optional)</label><input name="due" type="datetime-local" className="input" /></div>
        <div><label className="label">Marks</label><input name="max" type="number" min={1} defaultValue={100} className="input" /></div>
      </div>
      <Err e={error} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Uploading…" : "Post to students"}</button>
    </form>
  );
}

export function SubmitWork({ assignmentId, classroomId, mine, max, fileUrl }: any) {
  const { busy, error, run } = useMutate();
  const [edit, setEdit] = useState(!mine);
  if (mine && !edit) return (
    <div className="mt-4 rounded-md bg-paper p-4 text-sm">
      <div className="flex items-center justify-between"><b className="text-green">Submitted</b>
        {mine.score == null && <button onClick={() => setEdit(true)} className="text-ink underline">Edit</button>}</div>
      {mine.body && <p className="mt-2 whitespace-pre-line">{mine.body}</p>}
      {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-ink underline">Your attachment</a>}
      {mine.score != null && <div className="mt-3 border-t border-line pt-3"><span className="font-hand text-3xl text-redpen">{mine.score}/{max}</span>{mine.feedback && <p className="mt-1">{mine.feedback}</p>}</div>}
    </div>
  );
  return (
    <form className="mt-4 space-y-2 border-t border-line pt-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      run(async () => {
        const path = await upload(classroomId, f.get("file") as File);
        const body = String(f.get("body") || "");
        if (mine) return sb().from("submissions").update({ body, ...(path ? { attachment_path: path } : {}) }).eq("id", mine.id);
        return sb().from("submissions").insert({ assignment_id: assignmentId, student_id: await uid(), body, attachment_path: path });
      }, () => setEdit(false));
    }}>
      <label className="label">Your answers</label>
      <textarea name="body" rows={4} defaultValue={mine?.body ?? ""} className="input" placeholder="Type your workings, or attach a photo of your exercise book" />
      <input name="file" type="file" accept=".pdf,.doc,.docx,image/*" className="input" />
      <Err e={error} />
      <button className="btn-primary btn-sm" disabled={busy}>{busy ? "Submitting…" : mine ? "Update submission" : "Submit answers"}</button>
    </form>
  );
}

export function GradeForm({ sub, max }: any) {
  const { busy, error, run } = useMutate();
  return (
    <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      run(() => sb().from("submissions").update({ score: Number(f.get("score")), feedback: String(f.get("feedback") || "") || null }).eq("id", sub.id) as any);
    }}>
      <input name="score" type="number" min={0} max={max} required defaultValue={sub.score ?? ""} className="input w-20" aria-label="Score" />
      <span className="text-sm text-muted">/ {max}</span>
      <input name="feedback" defaultValue={sub.feedback ?? ""} className="input min-w-40 flex-1" placeholder="Feedback" aria-label="Feedback" />
      <button className="btn-ghost btn-sm" disabled={busy}>{sub.score != null ? "Update mark" : "Mark"}</button>
      <Err e={error} />
    </form>
  );
}

export function RosterAction({ classroomId, studentId, status }: any) {
  const { busy, run } = useMutate();
  const to = status === "active" ? "removed" : "active";
  return <button disabled={busy} className={to === "removed" ? "btn-danger btn-sm" : "btn-ghost btn-sm"}
    onClick={() => (to === "active" || confirm("Remove this student from the classroom?")) && run(() => sb().from("enrollments").update({ status: to }).eq("classroom_id", classroomId).eq("student_id", studentId) as any)}>
    {to === "removed" ? "Remove" : "Restore"}</button>;
}

export function ClassSettings({ c }: any) {
  const { busy, error, run } = useMutate();
  const router = useRouter();
  return (
    <div className="max-w-xl space-y-6">
      <form className="panel space-y-3 p-5" onSubmit={(e) => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        run(() => sb().from("classrooms").update({ title: String(f.get("title")), description: String(f.get("description") || ""), default_meeting_url: String(f.get("url") || "") || null }).eq("id", c.id) as any);
      }}>
        <h2 className="h-sec">Classroom details</h2>
        <div><label className="label">Name</label><input name="title" defaultValue={c.title} required className="input" /></div>
        <div><label className="label">Description</label><textarea name="description" defaultValue={c.description} rows={3} className="input" /></div>
        <div><label className="label">Regular meeting link</label><input name="url" type="url" defaultValue={c.default_meeting_url ?? ""} className="input" placeholder="https://zoom.us/j/…" /><p className="hint">Used for any class without its own link.</p></div>
        <Err e={error} />
        <button className="btn-primary" disabled={busy}>Save changes</button>
      </form>
      <div className="panel flex items-center justify-between gap-4 p-5">
        <div><div className="font-semibold">{c.is_archived ? "Restore classroom" : "Archive classroom"}</div><p className="text-sm text-muted">{c.is_archived ? "Make it visible to new students again." : "Hide it from your profile. Current students keep access."}</p></div>
        <button className={c.is_archived ? "btn-ghost" : "btn-danger"} disabled={busy}
          onClick={() => run(() => sb().from("classrooms").update({ is_archived: !c.is_archived }).eq("id", c.id) as any, () => router.refresh())}>{c.is_archived ? "Restore" : "Archive"}</button>
      </div>
    </div>
  );
}
