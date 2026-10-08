import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import { GrantCredits } from "../knowledge/Client";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: ledger }, { data: preds }] = await Promise.all([
    supabase.from("ai_credit_ledger").select("*, profiles!ai_credit_ledger_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("predictions").select("id, target_year, kind, created_at, subjects(name), profiles(full_name, role)").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="h-page">AI credits</h1>
      <p className="mt-1 text-muted">Top up students and teachers after they pay, and see how the predictor is being used.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div><GrantCredits /></div>
        <div className="space-y-8">
          <section>
            <h2 className="h-sec">Papers generated</h2>
            <div className="panel mt-3 divide-y divide-line">
              {(preds ?? []).length === 0 && <p className="p-5 text-muted">No papers yet.</p>}
              {(preds ?? []).map((p: any) => (
                <a key={p.id} href={`/predict/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-paper">
                  <div><div className="font-semibold">{p.subjects?.name} · WASSCE {p.target_year}</div><div className="text-sm text-muted">{p.profiles?.full_name} ({p.profiles?.role}) · {p.kind === "mock" ? "Mock exam" : "Practice set"}</div></div>
                  <span className="text-xs text-muted">{timeAgo(p.created_at)}</span>
                </a>
              ))}
            </div>
          </section>
          <section>
            <h2 className="h-sec">Credit history</h2>
            <div className="panel mt-3 divide-y divide-line">
              {(ledger ?? []).length === 0 && <p className="p-5 text-muted">No credit activity yet.</p>}
              {(ledger ?? []).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div><div className="font-semibold">{l.profiles?.full_name}</div><div className="text-muted">{l.reason}</div></div>
                  <div className="text-right"><div className={`font-bold tabular-nums ${l.delta > 0 ? "text-green" : "text-redpen"}`}>{l.delta > 0 ? `+${l.delta}` : l.delta}</div><div className="text-xs text-muted">{timeAgo(l.created_at)}</div></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
