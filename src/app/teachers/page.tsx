import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TeacherCard from "@/components/TeacherCard";

export default async function Page({ searchParams }: { searchParams: Promise<{ subject?: string; q?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: subjects }, { data: teachers }] = await Promise.all([
    supabase.from("subjects").select("name, slug").order("id"),
    supabase.from("teacher_profiles")
      .select("id, headline, years_experience, private_rate, profiles(full_name, avatar_url), teacher_subjects(subjects(name, slug))")
      .eq("status", "approved").order("approved_at", { ascending: false }),
  ]);
  const q = (sp.q ?? "").toLowerCase().trim();
  const list = (teachers ?? []).filter((t: any) =>
    (!sp.subject || t.teacher_subjects.some((s: any) => s.subjects?.slug === sp.subject)) &&
    (!q || t.profiles?.full_name?.toLowerCase().includes(q) || t.headline?.toLowerCase().includes(q)));
  const active = subjects?.find((s) => s.slug === sp.subject);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="h-page">{active ? `${active.name} teachers` : "Find a teacher"}</h1>
      <p className="mt-2 text-muted">Every teacher here has passed our screening. Watch their sample lessons before you subscribe.</p>
      <form className="mt-6 flex max-w-xl gap-2">
        {sp.subject && <input type="hidden" name="subject" value={sp.subject} />}
        <input name="q" defaultValue={sp.q} placeholder="Search by name or speciality" className="input" aria-label="Search teachers" />
        <button className="btn-primary">Search</button>
      </form>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/teachers${q ? `?q=${q}` : ""}`} className={!sp.subject ? "chip-on" : "chip"}>All subjects</Link>
        {(subjects ?? []).map((s) => (
          <Link key={s.slug} href={`/teachers?subject=${s.slug}${q ? `&q=${q}` : ""}`} className={sp.subject === s.slug ? "chip-on" : "chip"}>{s.name}</Link>
        ))}
      </div>
      {list.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((t: any) => <TeacherCard key={t.id} t={t} />)}</div>
      ) : (
        <div className="panel mt-8 p-10 text-center">
          <p className="font-display text-lg font-semibold">No approved teachers {active ? `for ${active.name}` : ""} yet</p>
          <p className="mt-1 text-muted">Try another subject, or check back soon. New teachers are approved every week.</p>
        </div>
      )}
    </div>
  );
}
