"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";

async function process(id: string) {
  const r = await fetch("/api/ai/ingest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ document_id: id }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Processing failed");
  return j;
}

export function UploadSource({ subjects }: { subjects: { id: number; name: string }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<"past_paper" | "examiner_report">("past_paper");
  const router = useRouter();
  const year = new Date().getFullYear();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const files = (f.getAll("file") as File[]).filter((x) => x.size);
    const text = String(f.get("text") || "").trim();
    if (!files.length && !text) return setErr("Attach a file or paste the text.");
    setErr(null);
    const s = createClient(); const { data: { user } } = await s.auth.getUser();
    const base = { kind, subject_id: Number(f.get("subject")), year: Number(f.get("year")), sitting: String(f.get("sitting")), paper: String(f.get("paper") || "") || null, created_by: user!.id };
    try {
      const jobs: { id: string; label: string }[] = [];
      if (files.length) {
        for (const file of files) {
          if (file.size > 30 * 1024 * 1024) throw new Error(`${file.name} is larger than 30 MB.`);
          setBusy(`Uploading ${file.name}…`);
          const path = `${base.subject_id}/${base.year}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
          const up = await s.storage.from("waec-sources").upload(path, file);
          if (up.error) throw up.error;
          const { data, error } = await s.from("source_documents").insert({ ...base, title: file.name, source_path: path, raw_text: text || null }).select("id").single();
          if (error) throw error;
          jobs.push({ id: data.id, label: file.name });
        }
      } else {
        const { data, error } = await s.from("source_documents").insert({ ...base, title: "Pasted text", raw_text: text }).select("id").single();
        if (error) throw error;
        jobs.push({ id: data.id, label: "pasted text" });
      }
      router.refresh();
      for (const j of jobs) { setBusy(`Agent is reading ${j.label}… this can take a minute or two`); await process(j.id).catch((e) => setErr(`${j.label}: ${e.message}`)); }
      form.reset();
    } catch (e: any) { setErr(e.message); }
    setBusy(null);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-5">
      <h2 className="h-sec">Add to knowledge base</h2>
      <div className="grid grid-cols-2 gap-2">
        {([["past_paper", "Past paper"], ["examiner_report", "Examiner report"]] as const).map(([k, l]) => (
          <button type="button" key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={`rounded-md border px-3 py-2 text-sm font-semibold ${kind === k ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{l}</button>
        ))}
      </div>
      <div><label className="label">Subject</label><select name="subject" className="input">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="label">Year</label><input name="year" type="number" min={1990} max={year} defaultValue={year - 1} required className="input" /></div>
        <div><label className="label">Sitting</label><select name="sitting" className="input"><option>May/June</option><option>Nov/Dec</option></select></div>
        <div><label className="label">Paper</label><input name="paper" className="input" placeholder="1, 2…" /></div>
      </div>
      <div><label className="label">Files</label><input name="file" type="file" multiple accept="application/pdf,text/plain,image/jpeg,image/png" className="input" /><p className="hint">PDF, text or photos, up to 30 MB each. Several files become separate documents with the same details.</p></div>
      <div><label className="label">Or paste the text</label><textarea name="text" rows={4} className="input" placeholder={kind === "past_paper" ? "Paste the questions…" : "Paste the chief examiner's report…"} /></div>
      {err && <p className="text-sm text-redpen">{err}</p>}
      <button className="btn-primary w-full" disabled={!!busy}>{busy ?? "Upload and let the agent read it"}</button>
    </form>
  );
}

export function ProcessButton({ id, status }: { id: string; status: string }) {
  const { busy, error, run } = useMutate();
  if (status === "processing" && !busy) return <span className="text-xs text-muted">Reading…</span>;
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost btn-sm" disabled={busy} onClick={() => run(() => process(id))}>{busy ? "Reading…" : status === "ready" ? "Re-read" : "Process"}</button>
      <button className="text-xs text-muted hover:text-redpen" disabled={busy} onClick={() => confirm("Delete this document and everything extracted from it?") && run(() => createClient().from("source_documents").delete().eq("id", id) as any)}>Delete</button>
      {error && <span className="text-xs text-redpen">{error}</span>}
    </div>
  );
}

export function GrantCredits() {
  const { busy, error, run } = useMutate();
  const [ok, setOk] = useState<string | null>(null);
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const form = e.currentTarget; const f = new FormData(form);
      run(async () => {
        const r = await createClient().rpc("admin_grant_credits", { p_email: String(f.get("email")), p_amount: Number(f.get("amount")), p_reason: String(f.get("reason") || "") });
        if (!r.error) setOk(`Done. They now have ${r.data} credits.`);
        return r;
      }, () => form.reset());
    }}>
      <h2 className="h-sec">Give AI credits</h2>
      <p className="text-sm text-muted">Each predicted paper costs 1 credit. Use this after a student or teacher pays you, or for promotions. Negative numbers remove credits.</p>
      <input name="email" type="email" required className="input" placeholder="Their account email" aria-label="Email" />
      <div className="grid grid-cols-[6rem_1fr] gap-2">
        <input name="amount" type="number" required defaultValue={10} className="input" aria-label="Credits" />
        <input name="reason" className="input" placeholder="Reason, e.g. MoMo payment ref" aria-label="Reason" />
      </div>
      {error && <p className="text-sm text-redpen">{error}</p>}
      {ok && <p className="text-sm text-green">{ok}</p>}
      <button className="btn-primary w-full" disabled={busy}>Add credits</button>
    </form>
  );
}
