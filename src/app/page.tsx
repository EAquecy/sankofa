import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ResultSlip from "@/components/ResultSlip";
import TeacherCard from "@/components/TeacherCard";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const [{ data: teachers }, { data: subjects }] = await Promise.all([
    supabase.from("teacher_profiles")
      .select("id, headline, years_experience, private_rate, profiles!teacher_profiles_id_fkey(full_name, avatar_url), teacher_subjects(subjects(name))")
      .eq("status", "approved").order("approved_at", { ascending: false }).limit(6),
    supabase.from("subjects").select("name, slug, category").order("id"),
  ]);

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
              The results slip<br />is not the last word.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
              Prepare for your WASSCE rewrite from home, with trained Ghanaian teachers who follow the GES syllabus.
              Join live classes, ask questions any time, and book extra hours when a topic won't stick.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">Start learning</Link>
              <Link href="/teachers" className="btn-ghost px-6 py-3 text-base">Browse teachers</Link>
            </div>
            <p className="mt-6 text-sm text-muted">Everything happens online. No one in your neighbourhood needs to know you're rewriting.</p>
          </div>
          <ResultSlip />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">Who Sankofa is for</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <Story title="You just missed the cut-off" body="Your friends are in level 100 and the neighbours have noticed. Rewrite quietly from your phone, at your own pace, with a teacher who has seen this before." />
          <Story title="You've been working for a few years" body="You saved up and you're ready to go back for that degree. Pick evening or weekend classes that fit around your shift." />
          <Story title="You're a teacher who explains it better" body="Turn the topics students fear (elective maths, chemistry, physics) into extra income. Build your own virtual classrooms and set your own hours." link={{ href: "/signup?role=teacher", label: "Apply to teach" }} />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-2xl font-bold">Find a teacher by subject</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {(subjects ?? []).map((s) => (
              <Link key={s.slug} href={`/teachers?subject=${s.slug}`} className={`rounded-full border px-4 py-2 text-[0.95rem] hover:border-ink ${s.category === "core" ? "border-ink/30 bg-ink/5 text-ink" : "border-line bg-white"}`}>{s.name}</Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">Core subjects are shaded blue.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Recently approved teachers</h2>
          <Link href="/teachers" className="font-semibold text-ink underline underline-offset-4">See all teachers</Link>
        </div>
        {teachers && teachers.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t: any) => <TeacherCard key={t.id} t={t} />)}
          </div>
        ) : (
          <div className="panel ruled mt-8 p-8 pl-20 leading-8">
            <p className="font-display text-lg font-semibold">Our first teachers are being screened right now.</p>
            <p className="text-muted">Are you a trained teacher? <Link className="font-semibold text-ink underline" href="/signup?role=teacher">Apply to be one of them.</Link></p>
          </div>
        )}
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Know which topics are due this year</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">WAEC questions come back in cycles. Our predictor agent studies years of past papers and chief examiners' reports, finds the topics due to return, and writes practice questions and full mock exams with marking guides.</p>
            <Link href="/predict" className="btn-gold mt-6 px-6 py-3 text-base">Try the predictor</Link>
          </div>
          <div className="ruled rounded-sm border border-[#c9d4ee] py-4 pl-20 pr-6 leading-8 shadow-[0_18px_40px_-22px_rgba(27,42,107,.4)]">
            <div className="font-display font-bold text-ink">Logarithms · Core Mathematics</div>
            <div className="text-muted">Examined 2006, 2010, 2014, 2018, 2022</div>
            <div className="text-muted">Repeats about every 4 years</div>
            <div className="text-muted">Examiners: candidates mixed up log laws</div>
            <div className="font-hand text-2xl text-redpen">Due in 2026. Revise it!</div>
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Every teacher is screened before they teach</h2>
            <p className="mt-4 text-white/75">Parents and students trust what they can verify. Here is what a teacher goes through before their profile goes live.</p>
          </div>
          <ol className="space-y-6">
            {[
              ["Teaching certificate and CV", "From a recognised college of education or university, plus the schools they've taught in. First-time teachers are welcome."],
              ["Two academic references", "We contact both referees directly to confirm the teacher's qualifications."],
              ["Ghana Card and digital address", "So every teacher on Sankofa is identifiable and accountable."],
              ["A recorded sample lesson per subject", "You watch them teach before you pay for a single hour."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-display font-bold text-ink">{i + 1}</span>
                <div><div className="font-display text-lg font-semibold">{t}</div><p className="mt-1 text-white/75">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted">
        <span>Sankofa · Go back and fetch it.</span>
        <span>Made in Ghana for WASSCE candidates.</span>
      </footer>
    </>
  );
}

function Story({ title, body, link }: { title: string; body: string; link?: { href: string; label: string } }) {
  return (
    <div className="border-l-2 border-redpen/70 pl-5">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{body}</p>
      {link && <Link href={link.href} className="mt-4 inline-block font-semibold text-ink underline underline-offset-4">{link.label}</Link>}
    </div>
  );
}
