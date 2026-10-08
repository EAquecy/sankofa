import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient, getMe } from "@/lib/supabase/server";
import { callTool, PAST_PAPER_TOOL, REPORT_TOOL } from "@/lib/ai";

export const maxDuration = 300;

export async function POST(req: Request) {
  const me = await getMe();
  if (me?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { document_id } = await req.json();
  const supabase = await createClient();
  const { data: doc } = await supabase.from("source_documents").select("*, subjects(name)").eq("id", document_id).single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  await supabase.from("source_documents").update({ status: "processing", error: null }).eq("id", doc.id);

  try {
    const content: Anthropic.ContentBlockParam[] = [];
    if (doc.source_path) {
      const { data: file, error } = await supabase.storage.from("waec-sources").download(doc.source_path);
      if (error || !file) throw new Error("Couldn't read the uploaded file.");
      const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      if (file.type === "application/pdf" || doc.source_path.endsWith(".pdf")) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
      else if (file.type.startsWith("image/")) content.push({ type: "image", source: { type: "base64", media_type: file.type as any, data: b64 } });
      else content.push({ type: "text", text: Buffer.from(b64, "base64").toString("utf8") });
    }
    if (doc.raw_text) content.push({ type: "text", text: doc.raw_text });
    if (!content.length) throw new Error("Nothing to read: upload a file or paste the text.");

    const [{ data: qt }, { data: ft }] = await Promise.all([
      supabase.from("past_questions").select("topic").eq("subject_id", doc.subject_id),
      supabase.from("examiner_findings").select("topic").eq("subject_id", doc.subject_id),
    ]);
    const topics = [...new Set([...(qt ?? []), ...(ft ?? [])].map((r: any) => r.topic).filter(Boolean))].slice(0, 300);
    const ctx = `Subject: ${doc.subjects?.name}. Exam: WASSCE ${doc.sitting} ${doc.year}${doc.paper ? `, Paper ${doc.paper}` : ""}.\nExisting topic names for this subject (reuse exactly when they match): ${topics.length ? topics.join(" | ") : "none yet"}`;
    content.push({ type: "text", text: ctx });

    let count = 0; let summary: string | null = null;
    if (doc.kind === "past_paper") {
      const out = await callTool(PAST_PAPER_TOOL,
        "You are digitising West African Senior School Certificate Examination (WASSCE) past papers for a Ghanaian revision platform. Extract EVERY question faithfully and completely, including sub-parts and objective options. Tag each with the Ghana Education Service SHS syllabus topic it tests. Keep topic names short and consistent (e.g. 'Quadratic equations', 'Acids, bases and salts').",
        content);
      const rows = (out.questions ?? []).map((q: any) => ({ document_id: doc.id, subject_id: doc.subject_id, year: doc.year, paper: doc.paper, question_number: q.question_number, topic: q.topic, subtopic: q.subtopic ?? null, body: q.body, marks: Number.isFinite(q.marks) ? q.marks : null }));
      await supabase.from("past_questions").delete().eq("document_id", doc.id);
      if (rows.length) { const r = await supabase.from("past_questions").insert(rows); if (r.error) throw r.error; }
      count = rows.length; summary = out.summary ?? null;
    } else {
      const out = await callTool(REPORT_TOOL,
        "You are analysing WAEC chief examiners' reports for WASSCE. Capture every concrete observation: questions candidates avoided, questions poorly answered, common errors, what was well answered, and the examiner's recommendations to teachers and candidates. Tag each finding with the GES SHS syllabus topic where possible.",
        content);
      const rows = (out.findings ?? []).map((f: any) => ({ document_id: doc.id, subject_id: doc.subject_id, year: doc.year, topic: f.topic ?? null, question_ref: f.question_ref ?? null, finding_type: f.finding_type, detail: f.detail }));
      await supabase.from("examiner_findings").delete().eq("document_id", doc.id);
      if (rows.length) { const r = await supabase.from("examiner_findings").insert(rows); if (r.error) throw r.error; }
      count = rows.length; summary = out.summary ?? null;
    }
    await supabase.from("source_documents").update({ status: "ready", items_count: count, summary }).eq("id", doc.id);
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    await supabase.from("source_documents").update({ status: "failed", error: String(e.message ?? e).slice(0, 500) }).eq("id", doc.id);
    return NextResponse.json({ error: e.message ?? "Processing failed" }, { status: 500 });
  }
}
