import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { fmtDateTime, fmtTime, initials, timeAgo, fmtDate } from "@/lib/utils";
import { MockGate, CopyCode, NewSession, DeleteRow, TopicForm, TopicControls, AskQuestion, AnswerForm, NewAssignment, SubmitWork, GradeForm, RosterAction, ClassSettings } from "./Client";

const TABS = [
  { k: "stream", label: "Classes" }, { k: "path", label: "Lesson path" }, { k: "discussion", label: "Questions" },
  { k: "classwork", label: "Classwork" }, { k: "students", label: "Students", owner: true }, { k: "settings", label: "Settings", owner: true },
];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "stream" } = await searchParams;
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = await createClient();
  const { data: c } = await supabase.from("classrooms")
    .select("*, subjects(name), teacher_profiles(id, status, profiles!teacher_profiles_id_fkey(full_name))").eq("id", id).maybeSingle();
  if (!c) notFound();
  const isOwner = c.teacher_id === me.id;
  const isAdmin = me.role === "admin";
  if (!isOwner && !isAdmin) {
    const { data: e } = await supabase.from("enrollments").select("status").eq("classroom_id", id).eq("student_id", me.id).maybeSingle();
    if (e?.status !== "active") redirect(`/teachers/${c.teacher_id}`);
  }
  const { data: topics } = await supabase.from("topics").select("*").eq("classroom_id", id).order("position").order("created_at");
  const covered = (topics ?? []).filter((t) => t.is_covered).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="ruled overflow-hidden rounded-xl border border-line py-6 pl-20 pr-6">
        <div className="text-sm text-muted">{c.subjects?.name} · {isOwner ? "Your classroom" : c.teacher_profiles?.profiles?.full_name}</div>
        <h1 className="mt-1 font-display text-3xl font-bold leading-8">{c.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 leading-8">
          <span className="text-sm text-muted">Class code</span><CopyCode code={c.code} />
          {c.default_meeting_url && <a href={c.default_meeting_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink underline">Regular meeting link</a>}
          {(topics ?? []).length > 0 && <span className="text-sm text-muted">{covered} of {topics!.length} topics covered</span>}
        </div>
        {c.is_archived && <p className="mt-2 text-sm font-semibold text-redpen">This classroom is archived.</p>}
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Classroom sections">
        {TABS.filter((t) => !t.owner || isOwner).map((t) => (
          <Link key={t.k} href={`?tab=${t.k}`} aria-current={tab === t.k ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[0.95rem] ${tab === t.k ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-text"}`}>{t.label}</Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "stream" && <Stream id={id} isOwner={isOwner} topics={topics ?? []} defaultUrl={c.default_meeting_url} />}
        {tab === "path" && <Path id={id} isOwner={isOwner} topics={topics ?? []} />}
        {tab === "discussion" && <Discussion id={id} me={me} isOwner={isOwner} topics={topics ?? []} />}
        {tab === "classwork" && <Classwork id={id} me={me} isOwner={isOwner} topics={topics ?? []} />}
        {tab === "students" && isOwner && <Students id={id} />}
        {tab === "settings" && isOwner && <ClassSettings c={c} />}
      </div>
    </div>
  );
}

async function Stream({ id, isOwner, topics, defaultUrl }: any) {
  const supabase = await createClient();
  const { data: sessions } = await supabase.from("class_sessions").select("*, topics(title)").eq("classroom_id", id).order("starts_at");
  const now = Date.now();
  const upcoming = (sessions ?? []).filter((s) => new Date(s.ends_at).getTime() > now);
  const past = (sessions ?? []).filter((s) => new Date(s.ends_at).getTime() <= now).reverse();
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h2 className="h-sec">Upcoming classes</h2>
        <div className="mt-3 space-y-2">
          {upcoming.length === 0 && <p className="text-muted">{isOwner ? "Schedule your first class. Subscribed students and followers are notified straight away." : "No classes scheduled yet. You'll be notified when one is."}</p>}
          {upcoming.map((s) => {
            const live = new Date(s.starts_at).getTime() - now < 15 * 60000;
            return (
              <div key={s.id} className="panel flex flex-wrap items-center gap-4 p-4">
                <div className="w-24"><div className="font-display font-bold tabular-nums">{fmtTime(s.starts_at)}–{fmtTime(s.ends_at)}</div><div className="text-xs text-muted">{fmtDateTime(s.starts_at).split(",")[0]}</div></div>
                <div className="min-w-0 flex-1"><div className="font-semibold">{s.title}</div>{s.topics?.title && <div className="text-sm text-muted">Topic: {s.topics.title}</div>}{s.notes && <div className="text-sm text-muted">{s.notes}</div>}</div>
                {(s.meeting_url || defaultUrl) && <a href={s.meeting_url || defaultUrl} target="_blank" rel="noreferrer" className={live ? "btn-gold btn-sm" : "btn-ghost btn-sm"}>{live ? "Join now" : "Meeting link"}</a>}
                {isOwner && <DeleteRow table="class_sessions" id={s.id} label="Cancel" />}
              </div>
            );
          })}
        </div>
        {past.length > 0 && <>
          <h3 className="mt-8 font-display font-semibold text-muted">Past classes</h3>
          <ul className="mt-2 divide-y divide-line text-sm">
            {past.slice(0, 15).map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.title}</span><span className="text-muted">{fmtDate(s.starts_at)}</span></li>)}
          </ul>
        </>}
      </div>
      {isOwner && <div><NewSession classroomId={id} topics={topics} defaultUrl={defaultUrl} /></div>}
    </div>
  );
}

function Path({ id, isOwner, topics }: any) {
  const pct = topics.length ? Math.round((topics.filter((t: any) => t.is_covered).length / topics.length) * 100) : 0;
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <h2 className="h-sec">Lesson path</h2>
        <p className="text-sm text-muted">Topics in teaching order, following the GES syllabus.</p>
        {topics.length > 0 && <div className="mt-4 h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-green" style={{ width: `${pct}%` }} /></div>}
        <ol className="mt-4 space-y-2">
          {topics.length === 0 && <p className="text-muted">{isOwner ? "Add the topics you'll cover, in order." : "The teacher hasn't published the lesson path yet."}</p>}
          {topics.map((t: any, i: number) => (
            <li key={t.id} className="panel flex gap-4 p-4">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${t.is_covered ? "bg-green text-white" : "border-2 border-line text-muted"}`}>{t.is_covered ? "✓" : i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{t.title}</div>
                {t.strand && <div className="text-xs text-muted">{t.strand}</div>}
                {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
              </div>
              {isOwner && <TopicControls topic={t} prev={topics[i - 1]} next={topics[i + 1]} />}
            </li>
          ))}
        </ol>
      </div>
      {isOwner && <TopicForm classroomId={id} nextPos={(topics.at(-1)?.position ?? 0) + 1} />}
    </div>
  );
}

async function Discussion({ id, me, isOwner, topics }: any) {
  const supabase = await createClient();
  const { data: qs } = await supabase.from("questions")
    .select("*, profiles!questions_author_id_fkey(full_name), topics(title), answers(*, profiles!answers_author_id_fkey(full_name))").eq("classroom_id", id)
    .order("created_at", { ascending: false }).limit(60);
  return (
    <div className="mx-auto max-w-3xl">
      <AskQuestion classroomId={id} topics={topics} />
      <p className="mt-2 text-xs text-muted">Questions are visible to everyone subscribed to this classroom. Classmates can answer too.</p>
      <div className="mt-6 space-y-4">
        {(qs ?? []).length === 0 && <p className="text-center text-muted">No questions yet. Be the first to ask.</p>}
        {(qs ?? []).map((q: any) => {
          const answers = [...q.answers].sort((a: any, b: any) => (b.is_teacher ? 1 : 0) - (a.is_teacher ? 1 : 0) || a.created_at.localeCompare(b.created_at));
          return (
            <article key={q.id} id={`q-${q.id}`} className="panel scroll-mt-24 p-5">
              <header className="flex items-center gap-2 text-sm">
                <Avatar name={q.profiles?.full_name} /><b>{q.profiles?.full_name}</b><span className="text-muted">{timeAgo(q.created_at)}</span>
                {q.topics?.title && <span className="chip">{q.topics.title}</span>}
                {q.is_resolved && <span className="chip border-green/30 text-green">Teacher answered</span>}
                {(q.author_id === me.id || isOwner) && <span className="ml-auto"><DeleteRow table="questions" id={q.id} label="Delete" small /></span>}
              </header>
              <p className="mt-3 whitespace-pre-line">{q.body}</p>
              {answers.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-line pl-4">
                  {answers.map((a: any) => (
                    <div key={a.id} className={a.is_teacher ? "rounded-md bg-ink/[0.05] p-3" : ""}>
                      <div className="flex items-center gap-2 text-sm">
                        <b>{a.profiles?.full_name}</b>{a.is_teacher && <span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold text-white">Teacher</span>}
                        <span className="text-muted">{timeAgo(a.created_at)}</span>
                        {(a.author_id === me.id || isOwner) && <span className="ml-auto"><DeleteRow table="answers" id={a.id} label="Delete" small /></span>}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-[0.95rem]">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <AnswerForm questionId={q.id} isOwner={isOwner} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

async function Classwork({ id, me, isOwner, topics }: any) {
  const supabase = await createClient();
  const { data: as } = await supabase.from("assignments").select("*, topics(title), submissions(*, profiles!submissions_student_id_fkey(full_name))").eq("classroom_id", id).order("created_at", { ascending: false });
  const paths = (as ?? []).flatMap((a: any) => [a.attachment_path, ...a.submissions.map((s: any) => s.attachment_path)]).filter(Boolean);
  const urls: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabase.storage.from("classwork").createSignedUrls(paths, 3600);
    (data ?? []).forEach((d: any) => { if (d.signedUrl) urls[d.path] = d.signedUrl; });
  }
  const { count: roster } = isOwner ? await supabase.from("enrollments").select("student_id", { count: "exact", head: true }).eq("classroom_id", id).eq("status", "active") : { count: 0 };
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <h2 className="h-sec">Questions and exercises</h2>
        {(as ?? []).length === 0 && <p className="text-muted">{isOwner ? "Upload questions for your students to answer." : "Nothing assigned yet."}</p>}
        {(as ?? []).map((a: any) => {
          const mine = a.submissions.find((s: any) => s.student_id === me.id);
          return (
            <article key={a.id} className="panel p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-semibold">{a.title}</h3>
                    {a.kind === "mock" && <span className="rounded-full bg-redpen px-2 py-0.5 text-xs font-bold text-white">Mock exam · {a.duration_minutes} min</span>}
                    {a.prediction_id && <span className="chip">AI predicted</span>}</div>
                  <div className="text-sm text-muted">{a.topics?.title ? `${a.topics.title} · ` : ""}{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"} · {a.max_score} marks</div>
                  {isOwner && a.prediction_id && <Link href={`/predict/${a.prediction_id}`} className="text-sm font-semibold text-ink underline">Open marking guide</Link>}
                </div>
                {isOwner && <DeleteRow table="assignments" id={a.id} label="Delete" small />}
              </div>
              {a.instructions && (a.kind === "mock" && !isOwner && !mine
                ? <MockGate id={a.id} minutes={a.duration_minutes ?? 60} text={a.instructions} />
                : <p className="mt-3 whitespace-pre-line">{a.instructions}</p>)}
              {a.attachment_path && urls[a.attachment_path] && <a href={urls[a.attachment_path]} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-ink underline">Download question sheet</a>}
              {isOwner ? (
                <details className="mt-4 rounded-md border border-line">
                  <summary className="cursor-pointer px-4 py-2 text-sm font-semibold">{a.submissions.length} of {roster ?? 0} submitted</summary>
                  <div className="divide-y divide-line">
                    {a.submissions.map((s: any) => (
                      <div key={s.id} className="p-4">
                        <div className="flex items-center gap-2 text-sm"><b>{s.profiles?.full_name}</b><span className="text-muted">{timeAgo(s.submitted_at)}</span></div>
                        {s.body && <p className="mt-1 whitespace-pre-line text-sm">{s.body}</p>}
                        {s.attachment_path && urls[s.attachment_path] && <a href={urls[s.attachment_path]} target="_blank" rel="noreferrer" className="text-sm font-semibold text-ink underline">View attached work</a>}
                        <GradeForm sub={s} max={a.max_score} />
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <SubmitWork assignmentId={a.id} classroomId={id} mine={mine} max={a.max_score} fileUrl={mine?.attachment_path ? urls[mine.attachment_path] : null} />
              )}
            </article>
          );
        })}
      </div>
      {isOwner && <NewAssignment classroomId={id} topics={topics} />}
    </div>
  );
}

async function Students({ id }: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase.from("enrollments").select("*, profiles!enrollments_student_id_fkey(full_name, school, exam_year)").eq("classroom_id", id).order("created_at");
  const active = (data ?? []).filter((e) => e.status === "active");
  const removed = (data ?? []).filter((e) => e.status === "removed");
  return (
    <div className="max-w-3xl">
      <h2 className="h-sec">{active.length} subscribed students</h2>
      <div className="panel mt-3 divide-y divide-line">
        {active.length === 0 && <p className="p-6 text-muted">Share your class code so students can join.</p>}
        {active.map((e: any) => (
          <div key={e.student_id} className="flex items-center gap-3 p-4">
            <Avatar name={e.profiles?.full_name} />
            <div className="flex-1"><div className="font-semibold">{e.profiles?.full_name}</div><div className="text-xs text-muted">{[e.profiles?.school, e.profiles?.exam_year && `WASSCE ${e.profiles.exam_year}`].filter(Boolean).join(" · ") || "No details"} · joined {fmtDate(e.created_at)}</div></div>
            <RosterAction classroomId={id} studentId={e.student_id} status="active" />
          </div>
        ))}
      </div>
      {removed.length > 0 && <>
        <h3 className="mt-8 font-display font-semibold text-muted">Removed</h3>
        <div className="panel mt-2 divide-y divide-line">
          {removed.map((e: any) => (
            <div key={e.student_id} className="flex items-center gap-3 p-4 text-muted"><div className="flex-1">{e.profiles?.full_name}</div><RosterAction classroomId={id} studentId={e.student_id} status="removed" /></div>
          ))}
        </div>
      </>}
    </div>
  );
}

function Avatar({ name }: { name?: string }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[11px] font-bold text-ink">{initials(name ?? "")}</span>;
}
