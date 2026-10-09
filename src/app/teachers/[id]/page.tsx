import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { cedis, DAYS, fmtDateTime, fmtTime, hhmm, initials, publicUrl } from "@/lib/utils";
import FollowButton from "./FollowButton";
import SubscribeButton from "./SubscribeButton";
import BookingForm from "./BookingForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getMe();
  const { data: t } = await supabase.from("teacher_profiles")
    .select("*, profiles!teacher_profiles_id_fkey(full_name, avatar_url), teacher_subjects(id, demo_video_path, subjects(id, name))").eq("id", id).maybeSingle();
  if (!t) return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <h1 className="h-page">This teacher isn't available</h1>
      <p className="mt-3 text-muted">Their profile is still being screened by the Sankofa team, or it's no longer active. Teachers appear here once they're approved.</p>
      <Link href="/teachers" className="btn-primary mt-6">Browse approved teachers</Link>
    </div>
  );

  const [{ data: classrooms }, { data: slots }, { data: upcoming }, { data: counts }] = await Promise.all([
    supabase.from("classrooms").select("id, title, description, code, subjects(name)").eq("teacher_id", id).eq("is_archived", false).order("created_at"),
    supabase.from("timetable_slots").select("*, classrooms(title, subjects(name))").eq("teacher_id", id).order("day_of_week").order("start_time"),
    supabase.rpc("public_upcoming_sessions", { p_teacher: id }),
    supabase.rpc("classroom_counts", { p_teacher: id }),
  ]);

  let following = false;
  let enrolledIds: string[] = [];
  if (me) {
    const [{ data: f }, { data: e }] = await Promise.all([
      supabase.from("follows").select("teacher_id").eq("student_id", me.id).eq("teacher_id", id).maybeSingle(),
      supabase.from("enrollments").select("classroom_id").eq("student_id", me.id).eq("status", "active"),
    ]);
    following = !!f;
    enrolledIds = (e ?? []).map((x) => x.classroom_id);
  }
  const name = t.profiles?.full_name ?? "Teacher";
  const isStudent = me?.role === "student";
  const myClassrooms = (classrooms ?? []).filter((c) => enrolledIds.includes(c.id));
  const countOf = (cid: string) => (counts ?? []).find((c: any) => c.classroom_id === cid)?.students ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {t.status !== "approved" && (
        <p className="mb-6 rounded-md bg-gold/20 px-4 py-2 text-sm">Preview: this profile is <b>{t.status}</b> and is not visible to students yet.</p>
      )}
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {t.profiles?.avatar_url
          ? <img src={t.profiles.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
          : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ink font-display text-3xl font-bold text-white">{initials(name)}</span>}
        <div className="flex-1">
          <h1 className="h-page">{name}</h1>
          <p className="mt-1 text-lg text-muted">{t.headline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {t.teacher_subjects.map((s: any) => <span key={s.id} className="chip">{s.subjects?.name}</span>)}
            <span className="chip">{t.years_experience ? `${t.years_experience} years teaching` : "New teacher"}</span>
          </div>
        </div>
        {isStudent && <FollowButton teacherId={id} initial={following} />}
        {!me && <Link href={`/login?next=/teachers/${id}`} className="btn-primary">Log in to follow</Link>}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          {t.bio && <section><h2 className="h-sec">About</h2><p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{t.bio}</p></section>}

          <section>
            <h2 className="h-sec">Sample lessons</h2>
            <p className="mt-1 text-sm text-muted">Watch how {name.split(" ")[0]} teaches before you subscribe.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {t.teacher_subjects.map((s: any) => (
                <figure key={s.id} className="overflow-hidden rounded-xl border border-line bg-white">
                  {s.demo_video_path
                    ? <video controls preload="metadata" className="aspect-video w-full bg-black" src={publicUrl("demo-videos", s.demo_video_path)!} />
                    : <div className="flex aspect-video items-center justify-center bg-paper text-sm text-muted">Video coming soon</div>}
                  <figcaption className="px-4 py-3 font-semibold">{s.subjects?.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section>
            <h2 className="h-sec">Classroom sessions</h2>
            <div className="mt-4 space-y-3">
              {(classrooms ?? []).length === 0 && <p className="text-muted">No classrooms open yet.</p>}
              {(classrooms ?? []).map((c: any) => (
                <div key={c.id} className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="font-display text-lg font-semibold">{c.title}</div>
                    <div className="text-sm text-muted">{c.subjects?.name} · {countOf(c.id)} students</div>
                    {c.description && <p className="mt-2 text-sm text-muted">{c.description}</p>}
                  </div>
                  {enrolledIds.includes(c.id)
                    ? <Link href={`/classroom/${c.id}`} className="btn-ghost">Open classroom</Link>
                    : isStudent ? <SubscribeButton classroomId={c.id} />
                    : !me ? <Link href={`/signup`} className="btn-ghost">Sign up to subscribe</Link> : null}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="h-sec">Weekly timetable</h2>
            {(slots ?? []).length === 0 ? <p className="mt-3 text-muted">No fixed timetable published yet.</p> : (
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
                {(slots ?? []).map((s: any) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-5 py-3 last:border-0">
                    <span className="w-28 font-semibold">{DAYS[s.day_of_week]}</span>
                    <span className="tabular-nums">{hhmm(s.start_time)} – {hhmm(s.end_time)}</span>
                    <span className="text-muted">{s.classrooms?.subjects?.name}</span>
                    <span className="chip ml-auto capitalize">{s.shift}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="panel p-5">
            <h2 className="h-sec">Availability</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Avail label="Weekday teaching" days={t.weekday_days} hours={t.weekday_hours} />
              <Avail label="Weekend teaching" days={t.weekend_days} hours={t.weekend_hours} />
              <Avail label="Replies to private session requests" days={t.private_response_days} hours={t.private_response_hours} />
              <Avail label="Answers public questions" days={t.comment_response_days} hours={t.comment_response_hours} />
            </dl>
          </div>
          <div className="panel p-5">
            <h2 className="h-sec">Extra hours</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-paper p-3"><div className="font-display text-2xl font-bold">{cedis(t.private_rate)}</div><div className="text-xs text-muted">per hour, private</div></div>
              <div className="rounded-lg bg-paper p-3"><div className="font-display text-2xl font-bold">{cedis(t.group_rate)}</div><div className="text-xs text-muted">per learner per hour, group</div></div>
            </div>
            {isStudent && (myClassrooms.length
              ? <BookingForm classrooms={myClassrooms.map((c: any) => ({ id: c.id, title: c.title }))} privateRate={Number(t.private_rate)} groupRate={Number(t.group_rate)} />
              : <p className="mt-4 text-sm text-muted">Subscribe to one of {name.split(" ")[0]}'s classrooms to book a private or group session.</p>)}
          </div>
          <div className="panel p-5">
            <h2 className="h-sec">Upcoming classes</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {(upcoming ?? []).length === 0 && <li className="text-muted">Nothing scheduled. Follow to be notified.</li>}
              {(upcoming ?? []).map((s: any) => (
                <li key={s.id}><div className="font-semibold">{s.title}</div><div className="text-muted">{s.subject} · {fmtDateTime(s.starts_at)}–{fmtTime(s.ends_at)}</div></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Avail({ label, days, hours }: { label: string; days: string[]; hours: string }) {
  return (
    <div>
      <dt className="font-semibold">{label}</dt>
      <dd className="text-muted">{days?.length ? days.map((d) => d.slice(0, 3)).join(", ") : "Not set"}{hours ? ` · ${hours}` : ""}</dd>
    </div>
  );
}
