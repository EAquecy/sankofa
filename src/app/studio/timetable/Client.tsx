"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";
import { DAYS } from "@/lib/utils";

const sb = () => createClient();
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

export function AddSlot({ classrooms }: { classrooms: any[] }) {
  const { busy, error, run, setError } = useMutate();
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      const start = String(f.get("start")), end = String(f.get("end"));
      const diff = toMin(end) - toMin(start);
      if (diff <= 0) return setError("End time must be after the start time.");
      if (diff > 120) return setError("A slot can't be longer than 2 hours.");
      const shift = toMin(start) < 12 * 60 ? "morning" : toMin(start) < 16 * 60 ? "afternoon" : "evening";
      run(async () => {
        const { data: { user } } = await sb().auth.getUser();
        return sb().from("timetable_slots").insert({ teacher_id: user!.id, classroom_id: f.get("classroom"), day_of_week: Number(f.get("day")), start_time: start, end_time: end, shift });
      }, () => form.reset());
    }}>
      <h2 className="h-sec">Add a weekly slot</h2>
      <div><label className="label">Classroom</label><select name="classroom" className="input">{classrooms.map((c) => <option key={c.id} value={c.id}>{c.subjects?.name} · {c.title}</option>)}</select></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label">Day</label><select name="day" className="input">{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}</select></div>
        <div><label className="label">Start</label><input name="start" type="time" required className="input" defaultValue="18:00" /></div>
        <div><label className="label">End</label><input name="end" type="time" required className="input" defaultValue="20:00" /></div>
      </div>
      {error && <p className="text-sm text-redpen">{error}</p>}
      <button className="btn-primary" disabled={busy}>Add slot</button>
    </form>
  );
}

export function DeleteSlot({ id }: { id: string }) {
  const { busy, run } = useMutate();
  return <button disabled={busy} onClick={() => run(() => sb().from("timetable_slots").delete().eq("id", id) as any)} className="underline" aria-label="Remove slot">remove</button>;
}

export function GenerateSessions({ slots }: { slots: any[] }) {
  const { busy, error, run } = useMutate();
  const [done, setDone] = useState<string | null>(null);
  async function go() {
    await run(async () => {
      const s = sb();
      const ids = [...new Set(slots.map((x) => x.classroom_id))];
      const { data: existing } = await s.from("class_sessions").select("classroom_id, starts_at").in("classroom_id", ids).gt("starts_at", new Date().toISOString());
      const have = new Set((existing ?? []).map((e) => `${e.classroom_id}|${new Date(e.starts_at).toISOString()}`));
      const rows: any[] = [];
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      for (let i = 0; i < 14; i++) {
        const day = new Date(today.getTime() + i * 86400000);
        for (const sl of slots.filter((x) => x.day_of_week === day.getUTCDay())) {
          const [sh, sm] = sl.start_time.split(":").map(Number); const [eh, em] = sl.end_time.split(":").map(Number);
          const st = new Date(day); st.setUTCHours(sh, sm, 0, 0);
          const en = new Date(day); en.setUTCHours(eh, em, 0, 0);
          if (st.getTime() < Date.now() || have.has(`${sl.classroom_id}|${st.toISOString()}`)) continue;
          rows.push({ classroom_id: sl.classroom_id, title: `${sl.classrooms?.subjects?.name ?? "Class"} (${sl.shift})`, starts_at: st.toISOString(), ends_at: en.toISOString() });
        }
      }
      if (!rows.length) { setDone("Your next two weeks are already scheduled."); return { error: null }; }
      const r = await s.from("class_sessions").insert(rows);
      if (!r.error) setDone(`${rows.length} classes scheduled. Students have been notified.`);
      return r;
    });
  }
  return (
    <div className="text-right">
      <button onClick={go} disabled={busy} className="btn-gold">{busy ? "Scheduling…" : "Schedule the next 2 weeks"}</button>
      {done && <p className="mt-1 text-sm text-green">{done}</p>}
      {error && <p className="mt-1 text-sm text-redpen">{error}</p>}
    </div>
  );
}
