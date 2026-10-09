import { redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { cedis, fmtDateTime, fmtTime } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";
import { CancelBooking, JoinGroup, LeaveGroup } from "./Actions";

export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = await createClient();
  const { data: all } = await supabase.from("bookings")
    .select("*, classrooms(title, subjects(name)), teacher_profiles(profiles!teacher_profiles_id_fkey(full_name)), booking_participants(student_id, profiles!booking_participants_student_id_fkey(full_name))")
    .order("starts_at", { ascending: false });
  const mine = (all ?? []).filter((b: any) => b.booking_participants.some((p: any) => p.student_id === me.id));
  const open = (all ?? []).filter((b: any) => b.kind === "group" && ["pending", "confirmed"].includes(b.status)
    && new Date(b.starts_at) > new Date() && !b.booking_participants.some((p: any) => p.student_id === me.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="h-page">Bookings</h1>
      <p className="mt-1 text-muted">Private and group extra hours with your teachers. To request one, open a teacher's profile.</p>

      {open.length > 0 && (
        <section className="mt-8">
          <h2 className="h-sec">Group sessions you can join</h2>
          <p className="text-sm text-muted">Started by classmates in your classrooms. You pay the per-learner rate.</p>
          <div className="mt-3 space-y-2">
            {open.map((b: any) => (
              <div key={b.id} className="panel flex flex-wrap items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="font-semibold">{b.topic}</div>
                  <div className="text-sm text-muted">{b.classrooms?.title} · {fmtDateTime(b.starts_at)}–{fmtTime(b.ends_at)} · {b.booking_participants.length} joined</div>
                </div>
                <span className="font-semibold">{cedis(b.rate_per_learner)}</span>
                <JoinGroup bookingId={b.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="h-sec">My sessions</h2>
        <div className="mt-3 space-y-3">
          {mine.length === 0 && <p className="text-muted">No bookings yet.</p>}
          {mine.map((b: any) => (
            <div key={b.id} className="panel p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-display text-lg font-semibold">{b.topic}</span><StatusPill s={b.status} /></div>
                  <div className="text-sm text-muted capitalize">{b.kind} · {b.teacher_profiles?.profiles?.full_name} · {b.classrooms?.title}</div>
                  <div className="mt-1 text-sm">{fmtDateTime(b.starts_at)}–{fmtTime(b.ends_at)} · <b>{cedis(b.rate_per_learner)}</b>{b.kind === "group" && " per learner"}</div>
                  {b.kind === "group" && <div className="mt-1 text-sm text-muted">Learners: {b.booking_participants.map((p: any) => p.profiles?.full_name).join(", ")}</div>}
                  {b.teacher_note && <p className="mt-2 rounded-md bg-paper px-3 py-2 text-sm"><b>Teacher:</b> {b.teacher_note}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {b.status === "confirmed" && b.meeting_url && <a href={b.meeting_url} target="_blank" rel="noreferrer" className="btn-gold btn-sm">Join meeting</a>}
                  {b.requested_by === me.id && ["pending", "confirmed"].includes(b.status) && <CancelBooking bookingId={b.id} />}
                  {b.requested_by !== me.id && ["pending", "confirmed"].includes(b.status) && <LeaveGroup bookingId={b.id} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
