"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function SignupForm({ initialRole }: { initialRole: "student" | "teacher" }) {
  const [role, setRole] = useState(initialRole);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const { data, error } = await createClient().auth.signUp({
      email, password: String(f.get("password")),
      options: { data: { full_name: String(f.get("full_name")).trim(), role }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) window.location.href = role === "teacher" ? "/studio" : "/student";
    else setSent(email);
  }

  if (sent) return (
    <div className="panel ruled mt-8 p-8 pl-20">
      <h2 className="h-sec">Check your inbox</h2>
      <p className="mt-2 leading-8 text-muted">We sent a confirmation link to <b className="text-text">{sent}</b>. Click it to activate your account, then log in.</p>
    </div>
  );

  const opt = (r: "student" | "teacher", title: string, desc: string) => (
    <button type="button" onClick={() => setRole(r)} aria-pressed={role === r}
      className={`rounded-lg border-2 p-4 text-left transition-colors ${role === r ? "border-ink bg-ink/5" : "border-line bg-white hover:border-ink/30"}`}>
      <div className="font-display font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted">{desc}</div>
    </button>
  );

  return (
    <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3">
        {opt("student", "I'm a student", "Preparing to write or rewrite WASSCE")}
        {opt("teacher", "I'm a teacher", "Trained teacher who wants to teach online")}
      </div>
      {role === "teacher" && (
        <p className="rounded-md bg-gold/15 px-3 py-2 text-sm">After sign-up you'll submit your teacher training certificate, CV, two references, Ghana Card and digital address. Your profile goes live once our team approves it.</p>
      )}
      <div><label className="label" htmlFor="full_name">Full name</label><input id="full_name" name="full_name" required minLength={3} className="input" placeholder="e.g. Ama Owusu" autoComplete="name" /></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
      <div><label className="label" htmlFor="password">Password</label><PasswordInput id="password" name="password"  required minLength={8}  autoComplete="new-password" /><p className="hint">At least 8 characters.</p></div>
      {err && <p className="text-sm text-redpen">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : role === "teacher" ? "Create teacher account" : "Create student account"}</button>
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-ink underline">Log in</Link></p>
    </form>
  );
}
