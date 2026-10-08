import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/utils";
import { QuestionCard, SendToClass, PrintButton } from "./Client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = await createClient();
  const { data: p } = await supabase.from("predictions").select("*, subjects(name)").eq("id", id).maybeSingle();
  if (!p) notFound();
  const isOwner = p.owner_id === me.id;
  const { data: classrooms } = me.role === "teacher" && isOwner
    ? await supabase.from("classrooms").select("id, title").eq("teacher_id", me.id).eq("is_archived", false)
    : { data: [] as any[] };
  const analysis: any[] = p.analysis ?? [];
  const questions: any[] = p.questions ?? [];
  const showAnswers = isOwner || me.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 print:py-0">
      <Link href="/predict" className="text-sm text-muted hover:underline print:hidden">All papers</Link>
      <div className="ruled mt-3 rounded-xl border border-line py-6 pl-20 pr-6 leading-8">
        <div className="text-sm text-muted">Sankofa predictor · generated {fmtDate(p.created_at)}</div>
        <h1 className="font-display text-3xl font-bold leading-10">{p.subjects?.name}: likely WASSCE {p.target_year} questions</h1>
        <div className="text-muted">{p.kind === "mock" ? "Mock exam" : "Practice set"} · {questions.length} questions · {questions.reduce((a, q) => a + (q.marks || 0), 0)} marks{p.focus ? ` · Focus: ${p.focus}` : ""}</div>
      </div>
      {p.summary && <p className="mt-6 text-lg leading-relaxed">{p.summary}</p>}
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        {(classrooms ?? []).length > 0 && <SendToClass prediction={p} classrooms={classrooms ?? []} />}
      </div>

      <section className="mt-10">
        <h2 className="h-sec">Why these topics</h2>
        <p className="text-sm text-muted">Topics ranked by how often they appear, whether they're due on their repeat cycle, and how often chief examiners flagged weak answers.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-muted"><tr><th className="px-3 py-2 font-semibold">Topic</th><th className="px-3 py-2 font-semibold">Years examined</th><th className="px-3 py-2 font-semibold">Cycle</th><th className="px-3 py-2 font-semibold">Status for {p.target_year}</th><th className="px-3 py-2 font-semibold">Examiner flags</th></tr></thead>
            <tbody>
              {analysis.slice(0, 15).map((t) => (
                <tr key={t.topic} className="border-t border-line align-top">
                  <td className="px-3 py-2 font-semibold">{t.topic}</td>
                  <td className="px-3 py-2 text-muted">{t.years.join(", ")}</td>
                  <td className="px-3 py-2 tabular-nums">{t.cycle ? `${t.cycle} yr` : "–"}</td>
                  <td className="px-3 py-2">{t.dueByCycle ? <span className="font-semibold text-redpen">Due</span> : t.overdue ? <span className="font-semibold text-[#7a5a00]">Overdue</span> : <span className="text-muted">Last seen {t.last}</span>}</td>
                  <td className="px-3 py-2 tabular-nums">{t.weakSignals || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="h-sec">Questions</h2>
        {questions.map((q) => <QuestionCard key={q.number} q={q} showAnswers={showAnswers} />)}
      </section>
      <p className="mt-10 text-sm text-muted">These questions are predictions based on past patterns. WAEC can examine any topic in the syllabus, so keep revising broadly.</p>
    </div>
  );
}
