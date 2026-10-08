"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const f = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) { setErr(error.message === "Email not confirmed" ? "Confirm your email first. Check your inbox for the link we sent." : error.message); setBusy(false); return; }
    window.location.href = next;
  }
  return (
    <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>
      {err && <p className="text-sm text-redpen">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      <p className="text-center text-sm text-muted">New here? <Link href="/signup" className="font-semibold text-ink underline">Create an account</Link></p>
    </form>
  );
}
