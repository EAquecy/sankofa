import Link from "next/link";
import { getMe } from "@/lib/supabase/server";

export default async function NotFound() {
  const me = await getMe();
  const home = !me ? "/" : me.role === "teacher" ? "/studio" : me.role === "admin" ? "/admin" : "/student";
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="ruled rounded-xl border border-line py-8 pl-20 pr-8 leading-8">
        <p className="font-hand text-3xl text-redpen">Page not found</p>
        <h1 className="font-display text-2xl font-bold leading-8">We couldn't find that page.</h1>
        <p className="text-muted">The link may be old, or the page may only be visible once a teacher is approved or you've joined the classroom.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={home} className="btn-primary">{me ? "Go to my dashboard" : "Go to the home page"}</Link>
        <Link href="/teachers" className="btn-ghost">Find a teacher</Link>
      </div>
    </div>
  );
}
