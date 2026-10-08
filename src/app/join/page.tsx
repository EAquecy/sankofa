"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function Page() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const code = String(new FormData(e.currentTarget).get("code"));
    const { data, error } = await createClient().rpc("join_classroom", { p_code: code });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push(`/classroom/${data}`);
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="h-page">Join a classroom</h1>
      <p className="mt-2 text-muted">Enter the class code your teacher shared, for example <span className="font-semibold text-text">KWAME-ISCI-7F2A</span>.</p>
      <form onSubmit={join} className="panel mt-6 space-y-4 p-6">
        <input name="code" required className="input text-center font-display text-xl uppercase tracking-wider" placeholder="TEACHER-SUBJ-XXXX" aria-label="Class code" />
        {err && <p className="text-sm text-redpen">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Joining…" : "Join classroom"}</button>
      </form>
    </div>
  );
}
