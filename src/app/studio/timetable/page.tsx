import { createClient, getMe } from "@/lib/supabase/server";
import { DAYS, hhmm } from "@/lib/utils";
import { AddSlot, DeleteSlot, GenerateSessions } from "./Client";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const HUES = ["bg-ink text-white", "bg-gold text-text", "bg-green text-white", "bg-redpen text-white", "bg-ink-soft text-white", "bg-[#7a5a00] text-white"];

export default async function Page() {
  const me = (await getMe())!;
  const supabase = await createClient();
  const [{ data: slots }, { data: classrooms }] = await Promise.all([
    supabase.from("timetable_slots").select("*, classrooms(title, subjects(name))").eq("teacher_id", me.id).order("start_time"),
    supabase.from("classrooms").select("id, title, subjects(name)").eq("teacher_id", me.id).eq("is_archived", false).order("created_at"),
  ]);
  const colour = (cid: string) => HUES[Math.max(0, (classrooms ?? []).findIndex((c) => c.id === cid)) % HUES.length];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="h-page">Timetable</h1><p className="mt-1 text-muted">Your regular weekly slots for each subject. Each slot is at most 2 hours.</p></div>
        {(slots ?? []).length > 0 && <GenerateSessions slots={slots ?? []} />}
      </div>

      <div className="mt-8 overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 gap-2">
          {ORDER.map((d) => (
            <div key={d} className={`rounded-xl border border-line p-2 ${d === 0 || d === 6 ? "bg-gold/[0.06]" : "bg-white"}`}>
              <div className="px-1 pb-2 font-display font-semibold">{DAYS[d].slice(0, 3)}</div>
              <div className="space-y-2">
                {(slots ?? []).filter((s) => s.day_of_week === d).map((s: any) => (
                  <div key={s.id} className={`rounded-lg p-2 text-xs ${colour(s.classroom_id)}`}>
                    <div className="font-bold tabular-nums">{hhmm(s.start_time)}–{hhmm(s.end_time)}</div>
                    <div className="mt-0.5 leading-snug">{s.classrooms?.subjects?.name}</div>
                    <div className="mt-1 flex items-center justify-between opacity-80"><span className="capitalize">{s.shift}</span><DeleteSlot id={s.id} /></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 max-w-xl">
        {(classrooms ?? []).length ? <AddSlot classrooms={classrooms ?? []} /> : <p className="text-muted">Create a classroom in your Studio first, then add its weekly slots here.</p>}
      </div>
    </div>
  );
}
