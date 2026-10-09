import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { fmtDateTime, fmtTime, initials } from "@/lib/utils";

export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role !== "student") redirect("/dashboard");
  const supabase = await createClient();
  const { data: enr } = await supabase.from("enrollments")
    .select("classroom_id, classrooms(id, title, code, subjects(name), teacher_profiles(id, profiles!teacher_profiles_id_fkey(full_name)))")
    .eq("student_id", me.id).eq("status", "active");
  const ids = (enr ?? []).map((e) => e.classroom_id);
  const [{ data: sessions }, { data: assignments }, { data: subs }, { data: follows }] = await Promise.all([
    ids.length ? supabase.from("class_sessions").select("id, title, starts_at, ends_at, meeting_url, classroom_id, classrooms(title)")
      .in("classroom_id", ids).gt("ends_at", new Date().toISOString()).order("starts_at").limit(8) : Promise.resolve({ data: [] as any[] }),
    ids.length ? supabase.from("assignments").select("id, title, due_at, classroom_id, classrooms(title)").in("classroom_id", ids).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [] as any[] }),
    supabase.from("submissions").select("assignment_id").eq("student_id", me.id),
    supabase.from("follows").select("teacher_id, teacher_profiles(id, headline, profiles!teacher_profiles_id_fkey(full_name))").eq("student_id", me.id),
  ]);
  const done = new Set((subs ?? []).map((s) => s.assignment_id));
  const todo = (assignments ?? []).filter((a: any) => !done.has(a.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="h-page">Akwaaba, {me.full_name.split(" ")[0]}</h1>
      <p className="mt-1 text-muted">Here's what's coming up in your classes.</p>

      {ids.length === 0 && (
        <div className="panel ruled mt-8 p-8 pl-20 leading-8">
          <p className="font-display text-lg font-semibold">You haven't joined a classroom yet</p>
          <p className="text-muted">Browse teachers and subscribe to a subject, or enter a class code your teacher shared.</p>
          <div className="mt-3 flex gap-2"><Link href="/teachers" className="btn-primary">Find a teacher</Link><Link href="/join" className="btn-ghost">Join with code</Link></div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="h-sec">Upcoming classes</h2>
            <div className="mt-3 space-y-2">
              {(sessions ?? []).length === 0 && <p className="text-muted">No classes scheduled yet.</p>}
              {(sessions ?? []).map((s: any) => {
                const live = new Date(s.starts_at).getTime() - Date.now() < 15 * 60000;
                return (
                  <div key={s.id} className="panel flex flex-wrap items-center gap-4 p-4">
                    <div className="w-20 text-center"><div className="font-display text-lg font-bold tabular-nums">{fmtTime(s.starts_at)}</div><div className="text-xs text-muted">{fmtDateTime(s.starts_at).split(",")[0]}</div></div>
                    <div className="min-w-0 flex-1"><div className="font-semibold">{s.title}</div><Link href={`/classroom/${s.classroom_id}`} className="text-sm text-muted hover:underline">{s.classrooms?.title}</Link></div>
                    {s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noreferrer" className={live ? "btn-gold btn-sm" : "btn-ghost btn-sm"}>{live ? "Join now" : "Meeting link"}</a>}
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="h-sec">Questions to answer</h2>
            <div className="mt-3 space-y-2">
              {todo.length === 0 && <p className="text-muted">You're all caught up.</p>}
              {todo.slice(0, 6).map((a: any) => (
                <Link key={a.id} href={`/classroom/${a.classroom_id}?tab=classwork`} className="panel flex items-center justify-between p-4 hover:border-ink/40">
                  <div><div className="font-semibold">{a.title}</div><div className="text-sm text-muted">{a.classrooms?.title}</div></div>
                  {a.due_at && <span className={`text-sm ${new Date(a.due_at) < new Date() ? "text-redpen" : "text-muted"}`}>Due {fmtDateTime(a.due_at)}</span>}
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-8">
          <section>
            <div className="flex items-center justify-between"><h2 className="h-sec">My classrooms</h2><Link href="/join" className="text-sm font-semibold text-ink underline">Join with code</Link></div>
            <div className="mt-3 space-y-2">
              {(enr ?? []).map((e: any) => (
                <Link key={e.classroom_id} href={`/classroom/${e.classroom_id}`} className="panel block p-4 hover:border-ink/40">
                  <div className="font-semibold">{e.classrooms?.title}</div>
                  <div className="text-sm text-muted">{e.classrooms?.subjects?.name} · {e.classrooms?.teacher_profiles?.profiles?.full_name}</div>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="h-sec">Teachers you follow</h2>
            <div className="mt-3 space-y-2">
              {(follows ?? []).length === 0 && <p className="text-sm text-muted">Follow teachers to get alerts when they schedule a class.</p>}
              {(follows ?? []).map((f: any) => (
                <Link key={f.teacher_id} href={`/teachers/${f.teacher_id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{initials(f.teacher_profiles?.profiles?.full_name ?? "")}</span>
                  <div className="min-w-0"><div className="truncate font-semibold">{f.teacher_profiles?.profiles?.full_name}</div><div className="truncate text-xs text-muted">{f.teacher_profiles?.headline}</div></div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
