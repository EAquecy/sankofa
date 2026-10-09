import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cedis, timeAgo } from "@/lib/utils";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: s }, { data: pending }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.from("teacher_profiles").select("id, profiles!teacher_profiles_id_fkey(full_name), teacher_subjects(subjects(name)), teacher_screening(submitted_at)").eq("status", "pending").limit(6),
    supabase.rpc("admin_list_users", { p_role: null, p_search: null }),
  ]);
  const st: any = s ?? {};
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="h-page">Overview</h1>
      <p className="mt-1 text-muted">How Sankofa is doing right now.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat n={st.teachers_pending} label="Applications to review" href="/admin/screening" alert={st.teachers_pending > 0} />
        <Stat n={st.teachers_approved} label="Approved teachers" href="/admin/teachers" />
        <Stat n={st.students} label="Students" href="/admin/students" />
        <Stat n={st.signups_week} label="Sign-ups this week" />
        <Stat n={st.classrooms} label="Active classrooms" />
        <Stat n={st.enrollments} label="Classroom subscriptions" />
        <Stat n={st.sessions_week} label="Classes in the next 7 days" />
        <Stat n={st.questions_open} label="Unanswered questions" />
        <Stat n={st.bookings_pending} label="Bookings awaiting teachers" />
        <Stat n={st.bookings_confirmed} label="Confirmed extra-hour sessions" />
        <Stat n={cedis(st.booking_value)} label="Value of confirmed sessions" />
        <Stat n={st.predictions} label="AI papers generated" href="/admin/credits" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between"><h2 className="h-sec">Waiting for screening</h2><Link href="/admin/screening" className="text-sm font-semibold text-ink underline">Open queue</Link></div>
          <div className="panel mt-3 divide-y divide-line">
            {(pending ?? []).length === 0 && <p className="p-5 text-muted">No applications waiting.</p>}
            {(pending ?? []).map((t: any) => {
              const sc = Array.isArray(t.teacher_screening) ? t.teacher_screening[0] : t.teacher_screening;
              return (
                <Link key={t.id} href={`/admin/teachers/${t.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-paper">
                  <div className="min-w-0"><div className="font-semibold">{t.profiles?.full_name}</div><div className="truncate text-sm text-muted">{t.teacher_subjects.map((x: any) => x.subjects?.name).join(", ")}</div></div>
                  {sc?.submitted_at && <span className="shrink-0 text-xs text-muted">{timeAgo(sc.submitted_at)}</span>}
                </Link>
              );
            })}
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between"><h2 className="h-sec">Newest accounts</h2><Link href="/admin/students" className="text-sm font-semibold text-ink underline">All students</Link></div>
          <div className="panel mt-3 divide-y divide-line">
            {(recent ?? []).length === 0 && <p className="p-5 text-muted">No sign-ups yet.</p>}
            {(recent ?? []).slice(0, 6).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0"><div className="font-semibold">{u.full_name}</div><div className="truncate text-sm text-muted">{u.email}</div></div>
                <div className="shrink-0 text-right text-xs text-muted"><span className="capitalize">{u.role}</span><div>{timeAgo(u.created_at)}</div></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="h-sec">Predictor knowledge base</h2>
        <p className="mt-1 text-muted">{st.past_questions ?? 0} past questions and {st.findings ?? 0} chief examiner remarks loaded. {st.credits_spent ?? 0} credits spent so far.</p>
        <Link href="/admin/knowledge" className="btn-ghost mt-3">Add past papers or reports</Link>
      </section>
    </div>
  );
}

function Stat({ n, label, href, alert }: { n: any; label: string; href?: string; alert?: boolean }) {
  const inner = <><div className={`font-display text-3xl font-bold ${alert ? "text-redpen" : ""}`}>{n ?? 0}</div><div className="text-sm text-muted">{label}</div></>;
  return href ? <Link href={href} className="panel p-4 hover:border-ink/40">{inner}</Link> : <div className="panel p-4">{inner}</div>;
}
