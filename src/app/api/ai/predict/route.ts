import { NextResponse } from "next/server";
import { createClient, getMe } from "@/lib/supabase/server";
import { analyseTopics } from "@/lib/analysis";
import { callTool, MODEL, PREDICT_TOOL, PREDICTION_COST } from "@/lib/ai";

export const maxDuration = 300;

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const body = await req.json();
  const subject_id = Number(body.subject_id);
  const target_year = Number(body.target_year);
  const kind = body.kind === "mock" ? "mock" : "practice";
  const num = Math.min(Math.max(Number(body.num_questions) || 10, 3), 30);
  const focus = String(body.focus ?? "").slice(0, 300);
  if (!subject_id || !target_year) return NextResponse.json({ error: "Choose a subject and year" }, { status: 400 });

  const supabase = await createClient();
  const [{ data: subject }, { data: qs }, { data: fs }, { data: wallet }] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", subject_id).single(),
    supabase.from("past_questions").select("topic, year, body, question_number, marks").eq("subject_id", subject_id).lt("year", target_year).order("year", { ascending: false }).limit(4000),
    supabase.from("examiner_findings").select("topic, year, finding_type, detail, question_ref").eq("subject_id", subject_id).lt("year", target_year).order("year", { ascending: false }).limit(1500),
    supabase.from("ai_wallets").select("credits").eq("user_id", me.id).maybeSingle(),
  ]);
  if (!qs?.length) return NextResponse.json({ error: `There are no ${subject?.name ?? ""} past papers in the knowledge base yet, so there's no pattern to analyse. Check back once the admin has uploaded some.` }, { status: 400 });
  if ((wallet?.credits ?? 0) < PREDICTION_COST) return NextResponse.json({ error: `You need ${PREDICTION_COST} AI credit${PREDICTION_COST > 1 ? "s" : ""} to generate a paper.`, code: "credits" }, { status: 402 });

  const analysis = analyseTopics(qs, fs ?? [], target_year);
  const top = analysis.slice(0, 25);
  const topSet = new Set(top.slice(0, 14).map((t) => t.topic.toLowerCase()));
  const samples = top.slice(0, 14).map((t) => {
    const ex = qs.filter((q) => q.topic.toLowerCase() === t.topic.toLowerCase()).slice(0, 2)
      .map((q) => `  [${q.year} Q${q.question_number ?? "?"}${q.marks ? `, ${q.marks} marks` : ""}] ${q.body.slice(0, 700)}`).join("\n");
    return `### ${t.topic}\n${ex}`;
  }).join("\n\n");
  const findings = (fs ?? []).filter((f) => !f.topic || topSet.has(f.topic.toLowerCase()) || f.finding_type === "recommendation").slice(0, 60)
    .map((f) => `- ${f.year} [${f.finding_type}] ${f.topic ? `${f.topic}: ` : ""}${f.detail}`).join("\n");
  const table = top.map((t, i) => `${i + 1}. ${t.topic}: score ${t.score}; ${t.reason}`).join("\n");

  const prompt = `Subject: ${subject?.name}
Target exam: WASSCE ${target_year}
Paper type requested: ${kind === "mock" ? "a full timed mock exam in authentic WAEC format (sections, instructions, mark allocation)" : "a targeted practice set"}
Number of questions: ${num}
${focus ? `Requester's focus: ${focus}\n` : ""}
## Topic recurrence analysis (computed from ${qs.length} past questions across ${new Set(qs.map((q) => q.year)).size} years)
${table}

## Example past questions on the leading topics
${samples}

## Chief examiner remarks
${findings || "None uploaded yet."}

Write ${num} NEW questions most likely to appear in WASSCE ${target_year}. Prioritise topics that are due on their cycle, overdue, frequently examined, or that examiners keep flagging. Mirror WAEC's wording, structure and difficulty, but do not copy past questions verbatim. For each, give a clear rationale citing the evidence, and a marking guide that addresses the mistakes examiners warned about.`;

  try {
    const out = await callTool(PREDICT_TOOL,
      "You are an expert WASSCE examiner and Ghanaian SHS teacher. You predict likely examination questions from historical recurrence patterns and chief examiners' reports, and you write high-quality exam-style questions with marking schemes. Be honest about uncertainty: these are informed predictions, not leaked questions.",
      [{ type: "text", text: prompt }], 20000);
    const { error: spendErr } = await supabase.rpc("consume_ai_credits", { p_amount: PREDICTION_COST, p_reason: `${subject?.name} ${target_year} ${kind} paper` });
    if (spendErr) return NextResponse.json({ error: spendErr.message, code: "credits" }, { status: 402 });
    const { data: pred, error } = await supabase.from("predictions").insert({
      owner_id: me.id, subject_id, target_year, kind, num_questions: num, focus: focus || null,
      analysis: top, questions: out.questions ?? [], summary: out.summary ?? null, credits_used: PREDICTION_COST, model: MODEL,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: pred.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "The agent couldn't finish. You weren't charged." }, { status: 500 });
  }
}
