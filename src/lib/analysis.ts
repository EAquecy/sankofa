export type TopicStat = {
  topic: string; years: number[]; questions: number; cycle: number | null; last: number;
  sinceLast: number; dueByCycle: boolean; overdue: boolean; weakSignals: number; score: number; reason: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function mode(nums: number[]) {
  if (!nums.length) return null;
  const c = new Map<number, number>();
  nums.forEach((n) => c.set(n, (c.get(n) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

export function analyseTopics(
  questions: { topic: string; year: number }[],
  findings: { topic: string | null; finding_type: string }[],
  targetYear: number,
): TopicStat[] {
  const byTopic = new Map<string, { label: string; years: Set<number>; n: number }>();
  for (const q of questions) {
    const k = norm(q.topic);
    if (!k) continue;
    const e = byTopic.get(k) ?? { label: q.topic.trim(), years: new Set<number>(), n: 0 };
    e.years.add(q.year); e.n++;
    byTopic.set(k, e);
  }
  const allYears = new Set(questions.map((q) => q.year));
  const span = Math.max(1, allYears.size);
  const weak = new Map<string, number>();
  for (const f of findings) {
    if (!f.topic || !["avoided", "poorly_answered", "common_error"].includes(f.finding_type)) continue;
    const fk = norm(f.topic);
    for (const k of byTopic.keys()) if (k === fk || k.includes(fk) || fk.includes(k)) weak.set(k, (weak.get(k) ?? 0) + 1);
  }

  const out: TopicStat[] = [];
  for (const [k, e] of byTopic) {
    const years = [...e.years].sort((a, b) => a - b);
    const gaps = years.slice(1).map((y, i) => y - years[i]).filter((g) => g > 0);
    const cycle = mode(gaps);
    const last = years[years.length - 1];
    const sinceLast = targetYear - last;
    const dueByCycle = !!cycle && sinceLast > 0 && sinceLast % cycle === 0;
    const overdue = !!cycle && sinceLast > cycle && !dueByCycle;
    const weakSignals = weak.get(k) ?? 0;
    const freq = years.length / span;
    let score = 0.35 * freq + (dueByCycle ? 0.3 : overdue ? 0.18 : 0) + 0.2 * Math.min(weakSignals / 3, 1) + (cycle ? 0.05 : 0);
    if (sinceLast === 1 && cycle && cycle > 1) score -= 0.08;
    const bits: string[] = [`appeared in ${years.join(", ")}`];
    if (cycle === 1) bits.push("examined almost every year");
    else if (cycle) bits.push(`repeats about every ${cycle} years`);
    if (dueByCycle) bits.push(`due again in ${targetYear} on that cycle`);
    else if (overdue) bits.push(`overdue since ${last + cycle!}`);
    if (weakSignals) bits.push(`chief examiners flagged weak answers ${weakSignals}×`);
    out.push({ topic: e.label, years, questions: e.n, cycle, last, sinceLast, dueByCycle, overdue, weakSignals, score: Math.round(score * 1000) / 1000, reason: bits.join("; ") });
  }
  return out.sort((a, b) => b.score - a.score);
}
