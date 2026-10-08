"use client";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";

export function RefVerify({ teacherId, n, verified }: { teacherId: string; n: number; verified: boolean }) {
  const { busy, run } = useMutate();
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={verified} disabled={busy} className="h-4 w-4 accent-[#0e5e3a]"
        onChange={(e) => run(() => createClient().from("teacher_screening").update({ [`ref${n}_verified`]: e.target.checked }).eq("teacher_id", teacherId) as any)} />
      {verified ? <span className="font-semibold text-green">Confirmed</span> : "Mark confirmed"}
    </label>
  );
}

export function Decision({ teacherId, status, notes }: { teacherId: string; status: string; notes: string | null }) {
  const { busy, error, run, setError } = useMutate();
  async function decide(next: "approved" | "rejected", note: string) {
    if (next === "rejected" && !note.trim()) return setError("Add a note so the teacher knows what to fix.");
    await run(async () => {
      const s = createClient(); const { data: { user } } = await s.auth.getUser();
      const a = await s.from("teacher_profiles").update({ status: next, admin_notes: note || null }).eq("id", teacherId);
      if (a.error) return a;
      return s.from("teacher_screening").update({ reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq("teacher_id", teacherId);
    });
  }
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => e.preventDefault()}>
      <h2 className="h-sec">Decision</h2>
      <textarea id="note" name="note" rows={4} defaultValue={notes ?? ""} className="input" placeholder="Notes for the teacher. Required when sending back." />
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && <button type="button" disabled={busy} className="btn btn-primary bg-green hover:bg-green/90"
          onClick={(e) => decide("approved", ((e.currentTarget.form as HTMLFormElement).note as HTMLTextAreaElement).value)}>Approve teacher</button>}
        <button type="button" disabled={busy} className="btn-danger"
          onClick={(e) => decide("rejected", ((e.currentTarget.form as HTMLFormElement).note as HTMLTextAreaElement).value)}>{status === "approved" ? "Suspend" : "Send back"}</button>
      </div>
      <p className="hint">The teacher is notified either way.</p>
      {error && <p className="text-sm text-redpen">{error}</p>}
    </form>
  );
}
