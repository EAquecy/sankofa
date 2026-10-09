import { createClient, getMe } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/utils";
import { ProfileForm, SubjectsManager } from "./Client";
import AvatarUploader from "@/components/AvatarUploader";

export default async function Page() {
  const me = (await getMe())!;
  const supabase = await createClient();
  const [{ data: tp }, { data: p }, { data: subjects }, { data: mine }] = await Promise.all([
    supabase.from("teacher_profiles").select("*").eq("id", me.id).single(),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", me.id).single(),
    supabase.from("subjects").select("id, name").order("id"),
    supabase.from("teacher_subjects").select("id, subject_id, demo_video_path, subjects(name)").eq("teacher_id", me.id).order("created_at"),
  ]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="h-page">Teacher profile</h1>
      <p className="mt-1 text-muted">This is what students see when they find you. We use it to advertise you across Sankofa.</p>
      <div className="mt-8 space-y-10">
        <section className="panel p-6"><AvatarUploader userId={me.id} name={p?.full_name ?? me.full_name} url={p?.avatar_url ?? null} /></section>
        <ProfileForm tp={tp} p={p} />
        <SubjectsManager all={subjects ?? []} mine={(mine ?? []).map((m: any) => ({ ...m, url: publicUrl("demo-videos", m.demo_video_path) }))} />
      </div>
    </div>
  );
}
