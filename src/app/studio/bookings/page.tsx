import { createClient, getMe } from "@/lib/supabase/server";
import { cedis, fmtDateTime, fmtTime } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";
import BookingActions from "./BookingActions";

export default async function Page() {
  const me = (await getMe())!;
  const supabase = await createClient();
  const { data } = await supabase.from("bookings")
    .select("*, classrooms(title, subjects(name)), profiles!bookings_requested_by_fkey(full_name), booking_participants(student_id, profiles(full_name))")
    .eq("teacher_id", me.id).order("starts_at", { ascending: true });
  const now = Date.now();
  const pending = (data ?? []).filter((b) => b.status === "pending" && new Date(b.ends_at).getTime() > now);
  const upcoming = (data ?? []).filter((b) => b.status === "confirmed");
  const history = (data ?? []).filter((b) => !pending.includes(b) && !upcoming.includes(b)).reverse();

  const Card = ({ b }: { b: any }) => {
    const n = b.booking_participants.length;
    return (
      <div className="panel p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2"><span className="font-display text-lg font-semibold">{b.topic}</span><StatusPill s={b.status} /><span className="chip capitalize">{b.kind}</span></div>
            <div className="text-sm text-muted">{b.classrooms?.subjects?.name} · {b.classrooms?.title}</div>
            <div className="mt-1 text-sm">{fmtDateTime(b.starts_at)}–{fmtTime(b.ends_at)}</div>
            <div className="mt-1 text-sm text-muted">Requested by {b.profiles?.full_name}{b.kind === "group" && ` · ${n} learner${n === 1 ? "" : "s"}: ${b.booking_participants.map((p: any) => p.profiles?.full_name).join(", ")}`}</div>
            {b.note && <p className="mt-2 rounded-md bg-paper px-3 py-2 text-sm">“{b.note}”</p>}
          </div>
          <div className="text-right"><div className="font-display text-xl font-bold">{cedis(Number(b.rate_per_learner) * n)}</div><div className="text-xs text-muted">{b.kind === "group" ? `${cedis(b.rate_per_learner)} × ${n}` : "total"}</div></div>
        </div>
        <BookingActions b={b} />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="h-page">Bookings</h1>
      <p className="mt-1 text-muted">Requests for private and group extra hours from your students.</p>
      <Section title="Waiting for your reply" items={pending} empty="No pending requests." Card={Card} />
      <Section title="Confirmed" items={upcoming} empty="Nothing confirmed yet." Card={Card} />
      {history.length > 0 && <Section title="History" items={history} empty="" Card={Card} />}
    </div>
  );
}

function Section({ title, items, empty, Card }: any) {
  return (
    <section className="mt-8">
      <h2 className="h-sec">{title}</h2>
      <div className="mt-3 space-y-3">{items.length ? items.map((b: any) => <Card key={b.id} b={b} />) : <p className="text-muted">{empty}</p>}</div>
    </section>
  );
}
