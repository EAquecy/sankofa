import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, timeAgo } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";

const TABS = ["pending", "approved", "rejected", "draft"];

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const supabase = await createClient();
  const [{ data: rows }, { data: all }] = await Promise.all([
    supabase.from("teacher_profiles").select("id, status, headline, created_at, approved_at, profiles(full_name), teacher_subjects(subjects(name)), teacher_screening(submitted_at, ref1_verified, ref2_verified)")
      .eq("status", status).order("created_at", { ascending: false }),
    supabase.from("teacher_profiles").select("status"),
  ]);
  const count = (s: string) => (all ?? []).filter((r) => r.status === s).length;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="h-page">Teacher screening</h1>
      <p className="mt-1 text-muted">Review documents, call references and approve teachers before they go live.</p>
      <nav className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link key={t} href={`?status=${t}`} className={`-mb-px border-b-2 px-4 py-2.5 capitalize ${status === t ? "border-ink font-semibold text-ink" : "border-transparent text-muted"}`}>
            {t === "draft" ? "Incomplete" : t} <span className="ml-1 rounded-full bg-paper px-2 text-xs">{count(t)}</span>
          </Link>
        ))}
      </nav>
      <div className="panel mt-6 divide-y divide-line">
        {(rows ?? []).length === 0 && <p className="p-8 text-center text-muted">{status === "pending" ? "No applications waiting. Nice work." : "Nobody here."}</p>}
        {(rows ?? []).map((r: any) => {
          const sc = Array.isArray(r.teacher_screening) ? r.teacher_screening[0] : r.teacher_screening;
          return (
            <Link key={r.id} href={`/admin/teachers/${r.id}`} className="flex flex-wrap items-center gap-4 p-4 hover:bg-paper">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-semibold">{r.profiles?.full_name}<StatusPill s={r.status} /></div>
                <div className="text-sm text-muted">{r.teacher_subjects.map((s: any) => s.subjects?.name).join(", ") || "No subjects yet"}</div>
              </div>
              <div className="text-right text-sm text-muted">
                {sc?.submitted_at ? <>Submitted {timeAgo(sc.submitted_at)}</> : <>Joined {fmtDate(r.created_at)}</>}
                <div>References verified: {(sc?.ref1_verified ? 1 : 0) + (sc?.ref2_verified ? 1 : 0)}/2</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
