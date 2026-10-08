"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function AdminLoginForm({ signedInAs, notAdmin }: { signedInAs: string | null; notAdmin: boolean }) {
  const [err, setErr] = useState<string | null>(notAdmin || signedInAs ? `${signedInAs ?? "That account"} doesn't have admin access. Sign in with an admin account.` : null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const f = new FormData(e.currentTarget);
    const s = createClient();
    await s.auth.signOut();
    const { data, error } = await s.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) { setErr(error.message === "Email not confirmed" ? "Confirm your email first using the link we sent you." : error.message); setBusy(false); return; }
    const { data: p } = await s.from("profiles").select("role").eq("id", data.user.id).single();
    if (p?.role !== "admin") { await s.auth.signOut(); setErr("This account doesn't have admin access."); setBusy(false); return; }
    window.location.href = "/admin";
  }
  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-2xl">
      <div><label className="label" htmlFor="email">Admin email</label><input id="email" name="email" type="email" required autoComplete="username" className="input" /></div>
      <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" name="password"  required autoComplete="current-password"  /></div>
      {err && <p className="text-sm text-redpen">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in to admin"}</button>
    </form>
  );
}
