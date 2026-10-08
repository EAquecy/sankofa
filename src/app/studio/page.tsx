import Link from "next/link";
import { createClient, getMe } from "@/lib/supabase/server";
import { fmtDateTime, fmtTime } from "@/lib/utils";
import StatusBanner from "@/components/StatusBanner";
import NewClassroom from "./NewClassroom";

export default async function Page() {
  const me = (await getMe())!;
  const supabase = await createClient();
  const [{ data: tp }, { data: classrooms }, { data: counts }, { data: tsubs }, { count: pendingBookings }] = await Promise.all([
    supabase.from("teacher_profiles").select("status, admin_notes").eq("id", me.id).single(),
    supabase.from("classrooms").select("id, title, code, is_archived, subjects(name)").eq("teacher_id", me.id).order("created_at"),
    supabase.rpc("classroom_counts", { p_teacher: me.id }),
    supabase.from("teacher_subjects").select("subjects(id, name)").eq("teacher_id", me.id),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("teacher_id", me.id).eq("status", "pending"),
  ]);
  const ids = (classrooms ?? []).map((c) => c.id);
  const [{ data: sessions }, { data: openQs }] = await Promise.all([
    ids.length ? supabase.from("class_sessions").select("id, title, starts_at, ends_at, classroom_id, classrooms(title)").in("classroom_id", ids).gt("ends_at", new Date().toISOString()).order("starts_at").limit(6) : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from("questions").select("id, body, classroom_id, classrooms(title)").in("classroom_id", ids).eq("is_resolved", false).order("created_at", { ascending: false }).limit(6) : Promise.resolve({ data: [] as any[] }),
  ]);
  const totalStudents = (counts ?? []).reduce((a: number, c: any) => a + Number(c.students), 0);
  const countOf = (cid: string) => (counts ?? []).find((c: any) => c.classroom_id === cid)?.students ?? 0;
  const subjects = (tsubs ?? []).map((s: any) => s.subjects);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <StatusBanner status={tp?.status ?? "draft"} notes={tp?.admin_notes} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="h-page">Studio</h1><p className="mt-1 text-muted">Your classrooms, classes and students in one place.</p></div>
        <Link href={`/teachers/${me.id}`} className="btn-ghost">View public profile</Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat n={ids.length} label="Classrooms" />
        <Stat n={totalStudents} label="Subscribed students" />
        <Stat n={(openQs ?? []).length} label="Unanswered questions" href={(openQs ?? [])[0] ? `/classroom/${openQs![0].classroom_id}?tab=discussion` : undefined} />
        <Stat n={pendingBookings ?? 0} label="Booking requests" href="/studio/bookings" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="h-sec">Classroom sessions</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(classrooms ?? []).map((c: any) => (
                <Link key={c.id} href={`/classroom/${c.id}`} className={`panel block p-5 hover:border-ink/40 ${c.is_archived ? "opacity-60" : ""}`}>
                  <div className="text-sm text-muted">{c.subjects?.name}{c.is_archived && " · archived"}</div>
                  <div className="font-display text-lg font-semibold">{c.title}</div>
                  <div className="mt-3 flex items-center justify-between text-sm"><span className="font-display font-bold tracking-wider text-ink">{c.code}</span><span className="text-muted">{countOf(c.id)} students</span></div>
                </Link>
              ))}
              {(classrooms ?? []).length === 0 && <p className="text-muted sm:col-span-2">Create a classroom for each subject you teach. Each one gets a code you can share with students.</p>}
            </div>
          </section>
          <section>
            <h2 className="h-sec">Questions waiting for you</h2>
            <div className="mt-3 space-y-2">
              {(openQs ?? []).length === 0 && <p className="text-muted">No unanswered questions.</p>}
              {(openQs ?? []).map((q: any) => (
                <Link key={q.id} href={`/classroom/${q.classroom_id}?tab=discussion#q-${q.id}`} className="panel block p-4 hover:border-ink/40">
                  <p className="line-clamp-2">{q.body}</p><div className="mt-1 text-sm text-muted">{q.classrooms?.title}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-8">
          <NewClassroom subjects={subjects} />
          <section>
            <div className="flex items-center justify-between"><h2 className="h-sec">Next classes</h2><Link href="/studio/timetable" className="text-sm font-semibold text-ink underline">Timetable</Link></div>
            <ul className="mt-3 space-y-3 text-sm">
              {(sessions ?? []).length === 0 && <li className="text-muted">Nothing scheduled.</li>}
              {(sessions ?? []).map((s: any) => (
                <li key={s.id}><Link href={`/classroom/${s.classroom_id}`} className="font-semibold hover:underline">{s.title}</Link><div className="text-muted">{s.classrooms?.title} · {fmtDateTime(s.starts_at)}–{fmtTime(s.ends_at)}</div></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const inner = <><div className="font-display text-3xl font-bold">{n}</div><div className="text-sm text-muted">{label}</div></>;
  return href ? <Link href={href} className="panel p-4 hover:border-ink/40">{inner}</Link> : <div className="panel p-4">{inner}</div>;
}
