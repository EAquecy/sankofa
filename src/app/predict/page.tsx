import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import PredictForm from "./PredictForm";

export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login?next=/predict");
  const supabase = await createClient();
  const [{ data: subjects }, { data: wallet }, { data: preds }, { data: pq }] = await Promise.all([
    supabase.from("subjects").select("id, name").order("id"),
    supabase.from("ai_wallets").select("credits").eq("user_id", me.id).maybeSingle(),
    supabase.from("predictions").select("id, target_year, kind, num_questions, created_at, subjects(name)").eq("owner_id", me.id).order("created_at", { ascending: false }),
    supabase.from("past_questions").select("subject_id, year").limit(10000),
  ]);
  const years = new Map<number, Set<number>>();
  (pq ?? []).forEach((r) => { if (!years.has(r.subject_id)) years.set(r.subject_id, new Set()); years.get(r.subject_id)!.add(r.year); });
  const subs = (subjects ?? []).map((s) => ({ ...s, years: years.get(s.id)?.size ?? 0 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="h-page">WASSCE predictor</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">WAEC topics come back in cycles. A question students struggled with in 2004 tends to return in 2008, then 2012. Our agent studies years of past papers and chief examiner reports to spot those cycles, then writes the questions most likely to show up in your exam, with a marking guide.</p>
          <ul className="mt-6 space-y-3 text-[0.95rem]">
            <li className="flex gap-3"><Dot />Every question comes with its evidence: the years the topic appeared and what examiners said about it.</li>
            <li className="flex gap-3"><Dot />Choose a practice set to drill weak topics, or a full mock exam in WAEC format.</li>
            {me.role === "teacher" && <li className="flex gap-3"><Dot />Send any paper straight to a classroom as an assignment or timed mock exam.</li>}
            <li className="flex gap-3"><Dot />These are informed predictions, not leaked questions. Use them to prioritise, not to skip topics.</li>
          </ul>
        </div>
        <PredictForm subjects={subs} credits={wallet?.credits ?? 0} role={me.role} />
      </div>

      <section className="mt-14">
        <h2 className="h-sec">Your papers</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(preds ?? []).length === 0 && <p className="text-muted">Papers you generate will be saved here.</p>}
          {(preds ?? []).map((p: any) => (
            <Link key={p.id} href={`/predict/${p.id}`} className="ruled block rounded-xl border border-line py-4 pl-20 pr-4 leading-8 hover:border-ink/40">
              <div className="font-display text-lg font-semibold">{p.subjects?.name}</div>
              <div className="text-sm text-muted">WASSCE {p.target_year} · {p.kind === "mock" ? "Mock exam" : "Practice set"} · {p.num_questions} questions</div>
              <div className="text-xs text-muted">{timeAgo(p.created_at)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
function Dot() { return <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-redpen" />; }
