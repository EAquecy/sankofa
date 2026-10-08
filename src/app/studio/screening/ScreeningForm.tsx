"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";

const sb = () => createClient();
const GPS = /^[A-Z]{2}-\d{3,4}-\d{4}$/i;
const CARD = /^GHA-\d{9}-\d$/i;

export default function ScreeningForm({ sc, status, profileOk, subjects }: { sc: any; status: string; profileOk: boolean; subjects: { name: string; ok: boolean }[] }) {
  const { busy, error, run, setError } = useMutate();
  const [saved, setSaved] = useState(false);
  const locked = status === "pending" || status === "approved";

  const checks = [
    { ok: profileOk, label: "Headline and bio on your profile", href: "/studio/profile" },
    { ok: subjects.length > 0 && subjects.every((s) => s.ok), label: subjects.length ? `Sample teaching video for every subject (${subjects.filter((s) => s.ok).length}/${subjects.length})` : "At least one subject with a sample teaching video", href: "/studio/profile#subjects" },
    { ok: !!sc.certificate_path, label: "Teacher training certificate" },
    { ok: !!sc.cv_path, label: "CV" },
    { ok: !!sc.ghana_card_path && CARD.test(sc.ghana_card_number ?? ""), label: "Ghana Card scan and number" },
    { ok: GPS.test(sc.digital_address ?? ""), label: "GhanaPost digital address" },
    { ok: !!(sc.ref1_name && sc.ref1_phone && sc.ref2_name && sc.ref2_phone), label: "Two academic references" },
    { ok: !!sc.first_time_teacher || !!sc.schools_taught, label: "Teaching history" },
  ];
  const ready = checks.every((c) => c.ok);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const gps = String(f.get("digital_address") || "").trim().toUpperCase();
    const card = String(f.get("ghana_card_number") || "").trim().toUpperCase();
    if (gps && !GPS.test(gps)) return setError("Digital address should look like GA-183-8164.");
    if (card && !CARD.test(card)) return setError("Ghana Card number should look like GHA-123456789-0.");
    await run(async () => {
      const s = sb(); const { data: { user } } = await s.auth.getUser();
      const patch: any = {
        ghana_card_number: card || null, digital_address: gps || null, phone: String(f.get("phone") || "") || null,
        training_college: String(f.get("training_college") || "") || null, schools_taught: String(f.get("schools_taught") || "") || null,
        first_time_teacher: f.get("first_time_teacher") === "on",
      };
      for (const k of ["ref1_name", "ref1_email", "ref1_phone", "ref1_relationship", "ref2_name", "ref2_email", "ref2_phone", "ref2_relationship"]) patch[k] = String(f.get(k) || "") || null;
      for (const [field, key] of [["certificate", "certificate_path"], ["cv", "cv_path"], ["ghana_card", "ghana_card_path"]] as const) {
        const file = f.get(field) as File;
        if (file?.size) {
          if (file.size > 10 * 1024 * 1024) return { error: { message: `${field.replace("_", " ")} file is larger than 10 MB.` } };
          const path = `${user!.id}/${field}-${Date.now()}.${file.name.split(".").pop()}`;
          const up = await s.storage.from("screening").upload(path, file);
          if (up.error) return up;
          patch[key] = path;
        }
      }
      return s.from("teacher_screening").update(patch).eq("teacher_id", user!.id);
    }, () => { setSaved(true); setTimeout(() => setSaved(false), 2500); });
  }

  async function submit() {
    await run(async () => {
      const s = sb(); const { data: { user } } = await s.auth.getUser();
      const a = await s.from("teacher_screening").update({ submitted_at: new Date().toISOString() }).eq("teacher_id", user!.id);
      if (a.error) return a;
      return s.from("teacher_profiles").update({ status: "pending" }).eq("id", user!.id);
    });
  }

  const File_ = ({ name, label, have }: { name: string; label: string; have: boolean }) => (
    <div><label className="label">{label}</label><input name={name} type="file" accept=".pdf,image/*,.doc,.docx" disabled={locked} className="input" />
      <p className="hint">{have ? "Uploaded. Choose a new file to replace it." : "PDF, Word or a clear photo, up to 10 MB."}</p></div>
  );

  return (
    <>
      <div className="panel mt-8 p-5">
        <h2 className="h-sec">Checklist</h2>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-3 text-[0.95rem]">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${c.ok ? "bg-green text-white" : "border-2 border-line"}`}>{c.ok ? "✓" : ""}</span>
              <span className={c.ok ? "" : "text-muted"}>{c.label}</span>
              {!c.ok && c.href && <Link href={c.href} className="text-sm font-semibold text-ink underline">Fix</Link>}
            </li>
          ))}
        </ul>
        {status === "pending" && <p className="mt-4 rounded-md bg-ink/5 px-3 py-2 text-sm">Submitted. We'll notify you when the review is complete.</p>}
        {status === "approved" && <p className="mt-4 rounded-md bg-green/10 px-3 py-2 text-sm text-green">You're approved and visible to students.</p>}
        {(status === "draft" || status === "rejected") && (
          <button onClick={submit} disabled={!ready || busy} className="btn-primary mt-4">{status === "rejected" ? "Resubmit for review" : "Submit for review"}</button>
        )}
      </div>

      <form onSubmit={save} className="mt-8 space-y-8">
        <fieldset disabled={locked} className="panel space-y-4 p-6">
          <legend className="sr-only">Qualifications</legend>
          <h2 className="h-sec">Qualifications</h2>
          <File_ name="certificate" label="Teacher training certificate" have={!!sc.certificate_path} />
          <div><label className="label">College of education or university</label><input name="training_college" defaultValue={sc.training_college ?? ""} className="input" placeholder="e.g. Wesley College of Education, Kumasi" /></div>
          <File_ name="cv" label="CV" have={!!sc.cv_path} />
          <div><label className="label">Schools you've taught in</label><textarea name="schools_taught" rows={3} defaultValue={sc.schools_taught ?? ""} className="input" placeholder="School, subject and years. One per line." /></div>
          <label className="flex items-center gap-2 text-[0.95rem]"><input type="checkbox" name="first_time_teacher" defaultChecked={sc.first_time_teacher} className="h-4 w-4 accent-[#1b2a6b]" /> I haven't taught in a school before</label>
        </fieldset>

        <fieldset disabled={locked} className="panel space-y-4 p-6">
          <h2 className="h-sec">Identity and accountability</h2>
          <File_ name="ghana_card" label="Ghana Card (front)" have={!!sc.ghana_card_path} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Ghana Card number</label><input name="ghana_card_number" defaultValue={sc.ghana_card_number ?? ""} className="input uppercase" placeholder="GHA-123456789-0" /></div>
            <div><label className="label">GhanaPost digital address</label><input name="digital_address" defaultValue={sc.digital_address ?? ""} className="input uppercase" placeholder="GA-183-8164" /></div>
          </div>
          <div className="max-w-xs"><label className="label">Phone number</label><input name="phone" type="tel" defaultValue={sc.phone ?? ""} className="input" placeholder="024 000 0000" /></div>
        </fieldset>

        <fieldset disabled={locked} className="panel space-y-4 p-6">
          <h2 className="h-sec">Academic references</h2>
          <p className="-mt-2 text-sm text-muted">Two people who can confirm your qualifications, such as a head of department, tutor or headteacher. We'll contact them directly.</p>
          {[1, 2].map((n) => (
            <div key={n} className="grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-2">
              <div className="font-semibold sm:col-span-2">Reference {n}</div>
              <input name={`ref${n}_name`} defaultValue={sc[`ref${n}_name`] ?? ""} className="input" placeholder="Full name" aria-label={`Reference ${n} name`} />
              <input name={`ref${n}_relationship`} defaultValue={sc[`ref${n}_relationship`] ?? ""} className="input" placeholder="Role, e.g. Head of Science, Achimota" aria-label={`Reference ${n} role`} />
              <input name={`ref${n}_phone`} type="tel" defaultValue={sc[`ref${n}_phone`] ?? ""} className="input" placeholder="Phone" aria-label={`Reference ${n} phone`} />
              <input name={`ref${n}_email`} type="email" defaultValue={sc[`ref${n}_email`] ?? ""} className="input" placeholder="Email" aria-label={`Reference ${n} email`} />
            </div>
          ))}
        </fieldset>

        {!locked && (
          <div className="sticky bottom-4 flex items-center gap-3">
            <button className="btn-primary shadow-lg" disabled={busy}>{busy ? "Saving…" : "Save documents"}</button>
            {saved && <span className="rounded bg-white px-2 py-1 text-sm text-green">Saved</span>}
          </div>
        )}
        {error && <p className="text-sm text-redpen">{error}</p>}
      </form>
    </>
  );
}
