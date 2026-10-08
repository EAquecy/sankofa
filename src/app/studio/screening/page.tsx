import { createClient, getMe } from "@/lib/supabase/server";
import StatusPill from "@/components/StatusPill";
import ScreeningForm from "./ScreeningForm";

export default async function Page() {
  const me = (await getMe())!;
  const supabase = await createClient();
  const [{ data: tp }, { data: sc }, { data: subs }] = await Promise.all([
    supabase.from("teacher_profiles").select("status, admin_notes, headline, bio").eq("id", me.id).single(),
    supabase.from("teacher_screening").select("*").eq("teacher_id", me.id).single(),
    supabase.from("teacher_subjects").select("demo_video_path, subjects(name)").eq("teacher_id", me.id),
  ]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3"><h1 className="h-page">Screening</h1><StatusPill s={tp?.status ?? "draft"} /></div>
      <p className="mt-2 text-muted">We verify every teacher before students can find them. Your documents are private: only you and the Sankofa screening team can see them.</p>
      {tp?.status === "rejected" && tp.admin_notes && <div className="mt-6 rounded-xl border-l-4 border-redpen bg-redpen/5 p-4"><b>Notes from our team:</b> {tp.admin_notes}</div>}
      <ScreeningForm sc={sc} status={tp?.status ?? "draft"} profileOk={!!tp?.headline && !!tp?.bio}
        subjects={(subs ?? []).map((s: any) => ({ name: s.subjects?.name, ok: !!s.demo_video_path }))} />
    </div>
  );
}
