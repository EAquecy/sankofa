import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
export const PREDICTION_COST = Number(process.env.PREDICTION_CREDIT_COST || 1);

export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("The AI agent isn't configured yet. Ask the Sankofa admin to add an Anthropic API key.");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const PAST_PAPER_TOOL: Anthropic.Tool = {
  name: "save_past_questions",
  description: "Save every question found in a WASSCE past paper.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "One or two sentences describing the paper (sections, number of questions)." },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question_number: { type: "string", description: "As printed, e.g. '3', '3(b)', 'Section B Q7'" },
            topic: { type: "string", description: "GES SHS syllabus topic. Reuse an existing topic name exactly when it matches." },
            subtopic: { type: "string" },
            body: { type: "string", description: "Full question text, including sub-parts and any options for objective questions. Use plain text math (x^2, sqrt(), ->)." },
            marks: { type: "integer" },
          },
          required: ["question_number", "topic", "body"],
        },
      },
    },
    required: ["questions"],
  },
};

export const REPORT_TOOL: Anthropic.Tool = {
  name: "save_examiner_findings",
  description: "Save the findings from a WAEC chief examiner's report.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Short overall summary of candidates' performance." },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string", description: "GES syllabus topic the finding concerns. Reuse an existing topic name exactly when it matches." },
            question_ref: { type: "string", description: "Question number referenced, if any" },
            finding_type: { type: "string", enum: ["avoided", "poorly_answered", "well_answered", "common_error", "recommendation", "general"] },
            detail: { type: "string", description: "What the examiner said, in a sentence or two." },
          },
          required: ["finding_type", "detail"],
        },
      },
    },
    required: ["findings"],
  },
};

export const PREDICT_TOOL: Anthropic.Tool = {
  name: "save_predicted_paper",
  description: "Save the predicted WASSCE questions.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "2–4 sentences: which topics are most likely and why, plus how to use this paper." },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: { type: "integer" },
            topic: { type: "string" },
            likelihood: { type: "string", enum: ["very high", "high", "medium"] },
            question: { type: "string", description: "A complete exam-style question in WAEC style with sub-parts and marks. Plain-text math." },
            marks: { type: "integer" },
            rationale: { type: "string", description: "Why this is likely: cite the years it appeared, the cycle and any examiner remarks." },
            evidence_years: { type: "array", items: { type: "integer" } },
            marking_guide: { type: "string", description: "Model answer / marking scheme with mark allocation, and the common mistakes examiners warned about." },
          },
          required: ["number", "topic", "likelihood", "question", "marks", "rationale", "marking_guide"],
        },
      },
    },
    required: ["summary", "questions"],
  },
};

export async function callTool(tool: Anthropic.Tool, system: string, content: Anthropic.ContentBlockParam[], maxTokens = 16000) {
  const client = anthropic();
  const stream = client.messages.stream({
    model: MODEL, max_tokens: maxTokens, system,
    tools: [tool], tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content }],
  });
  const msg = await stream.finalMessage();
  const block = msg.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  if (!block) throw new Error("The agent returned no structured result.");
  return block.input as any;
}
