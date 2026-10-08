"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function FollowButton({ teacherId, initial }: { teacherId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = on
      ? await supabase.from("follows").delete().eq("student_id", user.id).eq("teacher_id", teacherId)
      : await supabase.from("follows").insert({ student_id: user.id, teacher_id: teacherId });
    if (!error) setOn(!on);
    setBusy(false);
  }
  return <button onClick={toggle} disabled={busy} className={on ? "btn-ghost" : "btn-primary"} aria-pressed={on}>{on ? "Following" : "Follow for class alerts"}</button>;
}
