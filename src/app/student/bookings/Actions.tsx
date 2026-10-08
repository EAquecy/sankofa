"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function useAct() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return { busy, run: async (fn: () => Promise<any>) => { setBusy(true); const r = await fn(); if (r?.error) alert(r.error.message); setBusy(false); router.refresh(); } };
}
export function JoinGroup({ bookingId }: { bookingId: string }) {
  const { busy, run } = useAct();
  return <button className="btn-primary btn-sm" disabled={busy} onClick={() => run(async () => {
    const s = createClient(); const { data: { user } } = await s.auth.getUser();
    return s.from("booking_participants").insert({ booking_id: bookingId, student_id: user!.id });
  })}>Join group</button>;
}
export function LeaveGroup({ bookingId }: { bookingId: string }) {
  const { busy, run } = useAct();
  return <button className="btn-ghost btn-sm" disabled={busy} onClick={() => run(async () => {
    const s = createClient(); const { data: { user } } = await s.auth.getUser();
    return s.from("booking_participants").delete().eq("booking_id", bookingId).eq("student_id", user!.id);
  })}>Leave</button>;
}
export function CancelBooking({ bookingId }: { bookingId: string }) {
  const { busy, run } = useAct();
  return <button className="btn-danger btn-sm" disabled={busy} onClick={() => confirm("Cancel this session?") && run(() =>
    createClient().from("bookings").update({ status: "cancelled" }).eq("id", bookingId) as any)}>Cancel</button>;
}
