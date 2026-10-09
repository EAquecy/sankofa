import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cedis, fmtDateTime, publicUrl } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";
import { Decision, RefVerify } from "./Client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: t }, { data: sc }, { data: p }] = await Promise.all([
    supabase.from("teacher_profiles").select("*, teacher_subjects(id, demo_video_path, subjects(name))").eq("id", id).maybeSingle(),
    supabase.from("teacher_screening").select("*").eq("teacher_id", id).maybeSingle(),
    supabase.from("profiles").select("full_name, avatar_url, created_at").eq("id", id).maybeSingle(),
  ]);
  if (!t || !p) notFound();
  const docPaths = [sc?.certificate_path, sc?.cv_path, sc?.ghana_card_path].filter(Boolean) as string[];
  const signed: Record<string, string> = {};
  if (docPaths.length) {
    const { data } = await supabase.storage.from("screening").createSignedUrls(docPaths, 1800);
    (data ?? []).forEach((d: any) => { if (d.signedUrl) signed[d.path] = d.signedUrl; });
  }
  const Doc = ({ label, path }: { label: string; path?: string | null }) => (
    <div className="flex items-center justify-between rounded-lg border border-line p-3">
      <span className="font-semibold">{label}</span>
      {path && signed[path] ? <a href={signed[path]} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Open document</a> : <span className="text-sm text-redpen">Not uploaded</span>}
    </div>
  );
  const Field = ({ k, v }: { k: string; v: any }) => <div><dt className="text-sm text-muted">{k}</dt><dd className="font-semibold">{v || <span className="font-normal text-redpen">Missing</span>}</dd></div>;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/admin/screening" className="text-sm text-muted hover:underline">Back to screening</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-line text-xs text-muted">No photo</span>}
        <h1 className="h-page">{p.full_name}</h1><StatusPill s={t.status} />
        <Link href={`/teachers/${id}`} className="ml-auto btn-ghost btn-sm">Preview public profile</Link>
      </div>
      <p className="mt-1 text-muted">{t.headline}</p>
      {sc?.submitted_at && <p className="mt-1 text-sm text-muted">Submitted {fmtDateTime(sc.submitted_at)}{sc.reviewed_at && ` · last reviewed ${fmtDateTime(sc.reviewed_at)}`}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section className="panel space-y-3 p-5">
            <h2 className="h-sec">Documents</h2>
            <Doc label="Teacher training certificate" path={sc?.certificate_path} />
            <Doc label="CV" path={sc?.cv_path} />
            <Doc label="Ghana Card" path={sc?.ghana_card_path} />
            <dl className="grid gap-4 pt-2 sm:grid-cols-2">
              <Field k="Ghana Card number" v={sc?.ghana_card_number} />
              <Field k="Digital address" v={sc?.digital_address} />
              <Field k="Phone" v={sc?.phone} />
              <Field k="Training college" v={sc?.training_college} />
            </dl>
            <div><div className="text-sm text-muted">Teaching history</div><p className="whitespace-pre-line">{sc?.first_time_teacher ? "First-time teacher. " : ""}{sc?.schools_taught || ""}</p></div>
          </section>

          <section className="panel space-y-3 p-5">
            <h2 className="h-sec">References</h2>
            {[1, 2].map((n) => (
              <div key={n} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{sc?.[`ref${n}_name`] || <span className="text-redpen">Reference {n} missing</span>}</div>
                    <div className="text-sm text-muted">{sc?.[`ref${n}_relationship`]}</div>
                    <div className="mt-1 text-sm">{sc?.[`ref${n}_phone`] && <a className="underline" href={`tel:${sc[`ref${n}_phone`]}`}>{sc[`ref${n}_phone`]}</a>} {sc?.[`ref${n}_email`] && <> · <a className="underline" href={`mailto:${sc[`ref${n}_email`]}`}>{sc[`ref${n}_email`]}</a></>}</div>
                  </div>
                  <RefVerify teacherId={id} n={n} verified={!!sc?.[`ref${n}_verified`]} />
                </div>
              </div>
            ))}
          </section>

          <section className="panel space-y-4 p-5">
            <h2 className="h-sec">Sample lessons</h2>
            {t.teacher_subjects.length === 0 && <p className="text-redpen">No subjects added.</p>}
            {t.teacher_subjects.map((s: any) => (
              <div key={s.id}>
                <div className="font-semibold">{s.subjects?.name}</div>
                {s.demo_video_path ? <video src={publicUrl("demo-videos", s.demo_video_path)!} controls preload="metadata" className="mt-2 aspect-video w-full rounded bg-black" /> : <p className="text-sm text-redpen">No video</p>}
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <Decision teacherId={id} status={t.status} notes={t.admin_notes} />
          <section className="panel p-5 text-sm">
            <h2 className="h-sec">Profile</h2>
            <p className="mt-2 whitespace-pre-line text-muted">{t.bio || "No bio"}</p>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between"><dt className="text-muted">Experience</dt><dd>{t.years_experience} yrs</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Private rate</dt><dd>{cedis(t.private_rate)}/hr</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Group rate</dt><dd>{cedis(t.group_rate)}/learner/hr</dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
