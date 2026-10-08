"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cedis, localInputToISO } from "@/lib/utils";

export default function BookingForm({ classrooms, privateRate, groupRate }: { classrooms: { id: string; title: string }[]; privateRate: number; groupRate: number }) {
  const [kind, setKind] = useState<"private" | "group">("private");
  const [mins, setMins] = useState(60);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const cost = ((kind === "private" ? privateRate : groupRate) * mins) / 60;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const start = new Date(localInputToISO(String(f.get("start"))));
    if (start.getTime() < Date.now() + 3600_000) { setBusy(false); return setMsg({ ok: false, text: "Pick a time at least one hour from now." }); }
    const end = new Date(start.getTime() + mins * 60000);
    const { error } = await createClient().from("bookings").insert({
      classroom_id: f.get("classroom"), kind, topic: String(f.get("topic")), note: String(f.get("note") || "") || null,
      starts_at: start.toISOString(), ends_at: end.toISOString(),
    } as any);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    (e.target as HTMLFormElement).reset();
    setMsg({ ok: true, text: kind === "group" ? "Request sent. Classmates can now join it from their Bookings page." : "Request sent. You'll be notified when the teacher confirms." });
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3 border-t border-line pt-5">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Session type">
        {(["private", "group"] as const).map((k) => (
          <button type="button" key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${kind === k ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{k}</button>
        ))}
      </div>
      <div><label className="label">Classroom</label>
        <select name="classroom" className="input">{classrooms.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      <div><label className="label">Topic you need help with</label><input name="topic" required className="input" placeholder="e.g. Logarithms and indices" /></div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div><label className="label">Start (Accra time)</label><input name="start" type="datetime-local" required className="input" /></div>
        <div><label className="label">Length</label>
          <select value={mins} onChange={(e) => setMins(Number(e.target.value))} className="input">
            <option value={30}>30 min</option><option value={60}>1 hr</option><option value={90}>1.5 hr</option><option value={120}>2 hr</option>
          </select></div>
      </div>
      <div><label className="label">Note to teacher (optional)</label><textarea name="note" rows={2} className="input" /></div>
      <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm">
        <span className="text-muted">{kind === "group" ? "Cost per learner" : "Cost"}</span><b>{cedis(cost)}</b>
      </div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : `Request ${kind} session`}</button>
      <p className="text-xs text-muted">Payment is arranged once the teacher confirms.</p>
      {msg && <p className={`text-sm ${msg.ok ? "text-green" : "text-redpen"}`}>{msg.text}</p>}
    </form>
  );
}
