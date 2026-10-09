"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";
import { WEEKDAYS, WEEKEND, DAYS } from "@/lib/utils";

const sb = () => createClient();
const ALL = [...WEEKDAYS, ...WEEKEND];

function DayPicker({ name, options, value }: { name: string; options: string[]; value: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((d) => (
        <label key={d} className="cursor-pointer">
          <input type="checkbox" name={name} value={d} defaultChecked={value?.includes(d)} className="peer sr-only" />
          <span className="block rounded-md border border-line bg-white px-2.5 py-1.5 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">{d.slice(0, 3)}</span>
        </label>
      ))}
    </div>
  );
}

export function ProfileForm({ tp, p }: any) {
  const { busy, error, run } = useMutate();
  const [saved, setSaved] = useState(false);
  return (
    <form className="space-y-8" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      run(async () => {
        const s = sb(); const { data: { user } } = await s.auth.getUser();
        const a = await s.from("profiles").update({ full_name: String(f.get("full_name")) }).eq("id", user!.id);
        if (a.error) return a;
        return s.from("teacher_profiles").update({
          headline: String(f.get("headline")), bio: String(f.get("bio")), years_experience: Number(f.get("years") || 0),
          private_rate: Number(f.get("private_rate")), group_rate: Number(f.get("group_rate")),
          weekday_days: f.getAll("weekday_days"), weekday_hours: String(f.get("weekday_hours")),
          weekend_days: f.getAll("weekend_days"), weekend_hours: String(f.get("weekend_hours")),
          private_response_days: f.getAll("private_response_days"), private_response_hours: String(f.get("private_response_hours")),
          comment_response_days: f.getAll("comment_response_days"), comment_response_hours: String(f.get("comment_response_hours")),
        }).eq("id", user!.id);
      }, () => { setSaved(true); setTimeout(() => setSaved(false), 2500); });
    }}>
      <section className="panel space-y-4 p-6">
        <h2 className="h-sec">About you</h2>
        <div className="max-w-md"><label className="label">Full name</label><input name="full_name" defaultValue={p.full_name} required className="input" /></div>
        <div><label className="label">Headline</label><input name="headline" defaultValue={tp.headline} maxLength={90} className="input" placeholder="e.g. Elective maths made simple. 8 years at Prempeh College." /></div>
        <div><label className="label">Bio</label><textarea name="bio" defaultValue={tp.bio} rows={5} className="input" placeholder="How you teach, what results your students have had, and who you work best with." /></div>
        <div className="max-w-[12rem]"><label className="label">Years of teaching</label><input name="years" type="number" min={0} max={50} defaultValue={tp.years_experience} className="input" /></div>
      </section>

      <section className="panel space-y-5 p-6">
        <h2 className="h-sec">When you teach and respond</h2>
        <Row title="Weekday teaching days" name="weekday_days" options={WEEKDAYS} days={tp.weekday_days} hoursName="weekday_hours" hours={tp.weekday_hours} ph="e.g. 6:00 – 8:00 pm" />
        <Row title="Weekend teaching days" name="weekend_days" options={WEEKEND} days={tp.weekend_days} hoursName="weekend_hours" hours={tp.weekend_hours} ph="e.g. 9:00 – 11:00 am" />
        <Row title="When you reply to private session requests" name="private_response_days" options={ALL} days={tp.private_response_days} hoursName="private_response_hours" hours={tp.private_response_hours} ph="e.g. 12:00 – 2:00 pm" />
        <Row title="When you answer public questions" name="comment_response_days" options={ALL} days={tp.comment_response_days} hoursName="comment_response_hours" hours={tp.comment_response_hours} ph="e.g. 8:00 – 9:00 pm" />
      </section>

      <section className="panel space-y-4 p-6">
        <h2 className="h-sec">Extra-hours rates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Private session, per hour (GH₵)</label><input name="private_rate" type="number" min={0} step="0.5" defaultValue={tp.private_rate} className="input" /></div>
          <div><label className="label">Group session, per learner per hour (GH₵)</label><input name="group_rate" type="number" min={0} step="0.5" defaultValue={tp.group_rate} className="input" /></div>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button className="btn-primary shadow-lg" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
        {saved && <span className="rounded bg-white px-2 py-1 text-sm text-green">Profile saved</span>}
        {error && <span className="text-sm text-redpen">{error}</span>}
      </div>
    </form>
  );
}

function Row({ title, name, options, days, hoursName, hours, ph }: any) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-end">
      <div><div className="label">{title}</div><DayPicker name={name} options={options} value={days} /></div>
      <input name={hoursName} defaultValue={hours} className="input" placeholder={ph} aria-label={`${title} hours`} />
    </div>
  );
}

export function SubjectsManager({ all, mine }: { all: any[]; mine: any[] }) {
  const { busy, error, run } = useMutate();
  const [progress, setProgress] = useState<string | null>(null);
  const available = all.filter((s) => !mine.some((m) => m.subject_id === s.id));

  async function uploadVideo(row: any, file: File) {
    if (file.size > 50 * 1024 * 1024) return alert("Videos must be 50 MB or smaller. Try recording at 720p or trimming to 5–8 minutes.");
    setProgress(row.id);
    await run(async () => {
      const s = sb(); const { data: { user } } = await s.auth.getUser();
      const path = `${user!.id}/${row.subject_id}-${Date.now()}.${file.name.split(".").pop()}`;
      const up = await s.storage.from("demo-videos").upload(path, file, { contentType: file.type });
      if (up.error) return up;
      if (row.demo_video_path) await s.storage.from("demo-videos").remove([row.demo_video_path]);
      return s.from("teacher_subjects").update({ demo_video_path: path }).eq("id", row.id);
    });
    setProgress(null);
  }

  return (
    <section id="subjects" className="panel scroll-mt-24 space-y-4 p-6">
      <div><h2 className="h-sec">Subjects you teach</h2><p className="text-sm text-muted">For every subject, upload a short video of yourself teaching a topic from it. Students watch it on your profile, and it's required for screening.</p></div>
      <div className="space-y-3">
        {mine.map((m) => (
          <div key={m.id} className="rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 font-semibold">{m.subjects?.name}</div>
              {m.demo_video_path ? <span className="text-sm text-green">Sample video uploaded</span> : <span className="text-sm text-redpen">Sample video needed</span>}
              <label className="btn-ghost btn-sm cursor-pointer">
                {progress === m.id ? "Uploading…" : m.demo_video_path ? "Replace video" : "Upload video"}
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" disabled={!!progress} onChange={(e) => e.target.files?.[0] && uploadVideo(m, e.target.files[0])} />
              </label>
              <button className="text-sm text-muted hover:text-redpen" disabled={busy} onClick={() => confirm(`Remove ${m.subjects?.name}?`) && run(() => sb().from("teacher_subjects").delete().eq("id", m.id) as any)}>Remove</button>
            </div>
            {m.url && <video src={m.url} controls preload="metadata" className="mt-3 aspect-video w-full max-w-md rounded bg-black" />}
          </div>
        ))}
        {mine.length === 0 && <p className="text-sm text-muted">No subjects yet.</p>}
      </div>
      {available.length > 0 && (
        <form className="flex gap-2" onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.currentTarget);
          run(async () => { const s = sb(); const { data: { user } } = await s.auth.getUser(); return s.from("teacher_subjects").insert({ teacher_id: user!.id, subject_id: Number(f.get("subject")) }); });
        }}>
          <select name="subject" className="input max-w-xs" aria-label="Subject to add">{available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <button className="btn-primary" disabled={busy}>Add subject</button>
        </form>
      )}
      <p className="hint">MP4, WebM or MOV, up to 50 MB. A 5–8 minute clip at 720p fits comfortably.</p>
      {error && <p className="text-sm text-redpen">{error}</p>}
    </section>
  );
}
