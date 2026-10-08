import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: d } = await supabase.from("source_documents").select("*, subjects(name)").eq("id", id).maybeSingle();
  if (!d) notFound();
  const [{ data: qs }, { data: fs }] = await Promise.all([
    supabase.from("past_questions").select("*").eq("document_id", id).order("created_at"),
    supabase.from("examiner_findings").select("*").eq("document_id", id).order("created_at"),
  ]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/knowledge" className="text-sm text-muted hover:underline">Back to knowledge base</Link>
      <h1 className="h-page mt-2">{d.subjects?.name} {d.year} {d.sitting}{d.paper ? ` · Paper ${d.paper}` : ""}</h1>
      <p className="mt-1 text-muted">{d.kind === "past_paper" ? "Past paper" : "Chief examiner report"} · {d.title}</p>
      {d.summary && <p className="panel mt-6 p-4">{d.summary}</p>}
      <div className="mt-6 space-y-3">
        {(qs ?? []).map((q) => (
          <div key={q.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm"><b>Q{q.question_number}</b><span className="chip">{q.topic}</span>{q.subtopic && <span className="text-muted">{q.subtopic}</span>}{q.marks && <span className="ml-auto text-muted">{q.marks} marks</span>}</div>
            <p className="mt-2 whitespace-pre-line text-[0.95rem]">{q.body}</p>
          </div>
        ))}
        {(fs ?? []).map((f) => (
          <div key={f.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="chip capitalize">{f.finding_type.replace("_", " ")}</span>{f.topic && <b>{f.topic}</b>}{f.question_ref && <span className="text-muted">Q{f.question_ref}</span>}</div>
            <p className="mt-2 text-[0.95rem]">{f.detail}</p>
          </div>
        ))}
        {!qs?.length && !fs?.length && <p className="text-muted">Nothing extracted yet.</p>}
      </div>
    </div>
  );
}
