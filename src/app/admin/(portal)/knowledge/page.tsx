import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import { UploadSource, ProcessButton } from "./Client";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: subjects }, { data: docs }] = await Promise.all([
    supabase.from("subjects").select("id, name").order("id"),
    supabase.from("source_documents").select("*, subjects(name)").order("created_at", { ascending: false }).limit(200),
  ]);
  const cover = (subjects ?? []).map((s) => {
    const d = (docs ?? []).filter((x) => x.subject_id === s.id && x.status === "ready");
    const papers = d.filter((x) => x.kind === "past_paper");
    const years = [...new Set(papers.map((p) => p.year))].sort();
    return { ...s, papers: papers.length, reports: d.filter((x) => x.kind === "examiner_report").length, questions: papers.reduce((a, p) => a + p.items_count, 0), years };
  });
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="h-page">Predictor knowledge base</h1>
      <p className="mt-1 max-w-2xl text-muted">Feed the agent WASSCE past papers and chief examiner reports. It extracts every question and remark, tags them by syllabus topic, and uses the patterns to predict future papers.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="h-sec">Coverage by subject</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-muted"><tr><th className="px-4 py-2 font-semibold">Subject</th><th className="px-4 py-2 font-semibold">Past papers</th><th className="px-4 py-2 font-semibold">Questions</th><th className="px-4 py-2 font-semibold">Years</th><th className="px-4 py-2 font-semibold">Examiner reports</th></tr></thead>
                <tbody>
                  {cover.map((c) => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-4 py-2 font-semibold">{c.name}</td>
                      <td className="px-4 py-2 tabular-nums">{c.papers}</td>
                      <td className="px-4 py-2 tabular-nums">{c.questions}</td>
                      <td className="px-4 py-2 text-muted">{c.years.length ? `${c.years[0]}–${c.years.at(-1)} (${c.years.length})` : "None"}</td>
                      <td className="px-4 py-2 tabular-nums">{c.reports}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint">Predictions get sharper with more years. Aim for at least 8–10 years per subject so repeat cycles show up.</p>
          </section>

          <section>
            <h2 className="h-sec">Uploaded documents</h2>
            <div className="panel mt-3 divide-y divide-line">
              {(docs ?? []).length === 0 && <p className="p-6 text-muted">Nothing uploaded yet. Start with a past paper.</p>}
              {(docs ?? []).map((d: any) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/knowledge/${d.id}`} className="font-semibold hover:underline">{d.subjects?.name} {d.year} {d.sitting}{d.paper ? ` · Paper ${d.paper}` : ""}</Link>
                    <div className="text-sm text-muted">{d.kind === "past_paper" ? "Past paper" : "Chief examiner report"} · {timeAgo(d.created_at)}{d.status === "ready" && ` · ${d.items_count} ${d.kind === "past_paper" ? "questions" : "findings"}`}</div>
                    {d.status === "failed" && <div className="text-sm text-redpen">{d.error}</div>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${d.status === "ready" ? "bg-green/10 text-green" : d.status === "failed" ? "bg-redpen/10 text-redpen" : "bg-gold/20 text-[#7a5a00]"}`}>{d.status}</span>
                  <ProcessButton id={d.id} status={d.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-8">
          <UploadSource subjects={subjects ?? []} />
        </aside>
      </div>
    </div>
  );
}
