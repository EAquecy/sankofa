"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function SubscribeButton({ classroomId }: { classroomId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  async function go() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("enrollments").insert({ classroom_id: classroomId, student_id: user!.id });
    if (error) { setErr(error.code === "23505" ? "You were removed from this classroom." : error.message); setBusy(false); return; }
    router.push(`/classroom/${classroomId}`);
  }
  return <div className="text-right"><button onClick={go} disabled={busy} className="btn-gold">{busy ? "Subscribing…" : "Subscribe"}</button>{err && <p className="mt-1 text-xs text-redpen">{err}</p>}</div>;
}
