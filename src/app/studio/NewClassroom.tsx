"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMutate } from "@/components/useMutate";

export default function NewClassroom({ subjects }: { subjects: { id: number; name: string }[] }) {
  const { busy, error, run } = useMutate();
  const router = useRouter();
  if (!subjects.length) return (
    <div className="panel p-5"><h2 className="h-sec">New classroom</h2><p className="mt-2 text-sm text-muted">Add the subjects you teach on your profile first.</p><Link href="/studio/profile#subjects" className="btn-primary mt-3">Add subjects</Link></div>
  );
  return (
    <form className="panel space-y-3 p-5" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget);
      run(async () => {
        const s = createClient(); const { data: { user } } = await s.auth.getUser();
        const r = await s.from("classrooms").insert({ teacher_id: user!.id, subject_id: Number(f.get("subject")), title: String(f.get("title")), description: String(f.get("description") || "") }).select("id").single();
        if (!r.error) router.push(`/classroom/${r.data.id}?tab=path`);
        return r;
      });
    }}>
      <h2 className="h-sec">New classroom</h2>
      <div><label className="label">Subject</label><select name="subject" className="input">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div><label className="label">Name</label><input name="title" required className="input" placeholder="e.g. Integrated Science: evening rewriters" /></div>
      <div><label className="label">Who it's for (optional)</label><textarea name="description" rows={2} className="input" placeholder="e.g. For private candidates writing Nov/Dec" /></div>
      {error && <p className="text-sm text-redpen">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>Create classroom</button>
      <p className="hint">A class code with your name and subject is generated for you.</p>
    </form>
  );
}
