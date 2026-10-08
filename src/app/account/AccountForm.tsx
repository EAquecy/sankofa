"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function AccountForm({ id, role, initial }: { id: string; role: string; initial: any }) {
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await createClient().from("profiles").update({
      full_name: String(f.get("full_name")), school: String(f.get("school") || "") || null,
      exam_year: f.get("exam_year") ? Number(f.get("exam_year")) : null,
    }).eq("id", id);
    setMsg(error ? error.message : "Saved");
    router.refresh();
  }
  return (
    <form onSubmit={save} className="panel mt-6 space-y-4 p-6">
      <div><label className="label">Full name</label><input name="full_name" defaultValue={initial.full_name} required className="input" /></div>
      {role === "student" && <>
        <div><label className="label">Senior high school you attended</label><input name="school" defaultValue={initial.school ?? ""} className="input" placeholder="e.g. Accra Academy" /></div>
        <div><label className="label">WASSCE year you're preparing for</label><input name="exam_year" type="number" min={2024} max={2035} defaultValue={initial.exam_year ?? ""} className="input" /></div>
      </>}
      <button className="btn-primary">Save changes</button>
      {msg && <span className="ml-3 text-sm text-muted">{msg}</span>}
    </form>
  );
}
