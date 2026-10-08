"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";

export default function BookingActions({ b }: { b: any }) {
  const { busy, error, run } = useMutate();
  const [open, setOpen] = useState(false);
  const upd = (patch: any) => run(() => createClient().from("bookings").update(patch).eq("id", b.id) as any);
  if (b.status === "pending") return (
    <div className="mt-4 border-t border-line pt-4">
      {open ? (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); upd({ status: "confirmed", meeting_url: String(f.get("url")), teacher_note: String(f.get("note") || "") || null }); }}>
          <input name="url" type="url" required className="input" placeholder="Google Meet or Zoom link for this session" />
          <input name="note" className="input" placeholder="Note to student, e.g. payment details or what to prepare" />
          <div className="flex gap-2"><button className="btn-primary btn-sm" disabled={busy}>Confirm session</button><button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Back</button></div>
        </form>
      ) : (
        <div className="flex gap-2"><button className="btn-primary btn-sm" onClick={() => setOpen(true)}>Accept</button><button className="btn-danger btn-sm" disabled={busy} onClick={() => { const r = prompt("Reason for declining (shown to the student)"); if (r !== null) upd({ status: "declined", teacher_note: r || null }); }}>Decline</button></div>
      )}
      {error && <p className="mt-2 text-sm text-redpen">{error}</p>}
    </div>
  );
  if (b.status === "confirmed") return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {b.meeting_url && <a href={b.meeting_url} target="_blank" rel="noreferrer" className="btn-gold btn-sm">Open meeting</a>}
      <button className="btn-ghost btn-sm" disabled={busy} onClick={() => upd({ status: "completed" })}>Mark as taught</button>
      <button className="btn-danger btn-sm" disabled={busy} onClick={() => confirm("Cancel this confirmed session?") && upd({ status: "cancelled" })}>Cancel</button>
      {error && <p className="text-sm text-redpen">{error}</p>}
    </div>
  );
  return null;
}
