import Link from "next/link";
export default function StatusBanner({ status, notes }: { status: string; notes?: string | null }) {
  if (status === "approved") return null;
  const map: Record<string, { cls: string; title: string; body: string; cta?: [string, string] }> = {
    draft: { cls: "border-gold bg-gold/10", title: "Finish your application to go live", body: "Add your subjects with a sample teaching video, then submit your screening documents. You can set up classrooms while you wait, but students can't find you until you're approved.", cta: ["/studio/screening", "Continue application"] },
    pending: { cls: "border-ink/30 bg-ink/5", title: "Your application is with our screening team", body: "We're checking your documents and contacting your references. You'll get a notification as soon as there's a decision." },
    rejected: { cls: "border-redpen/40 bg-redpen/5", title: "Your application needs changes", body: notes || "Please review your documents and resubmit.", cta: ["/studio/screening", "Update and resubmit"] },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <div className={`mb-8 flex flex-wrap items-center gap-4 rounded-xl border-l-4 p-5 ${m.cls}`}>
      <div className="flex-1"><div className="font-display text-lg font-semibold">{m.title}</div><p className="mt-1 text-sm text-muted">{m.body}</p></div>
      {m.cta && <Link href={m.cta[0]} className="btn-primary">{m.cta[1]}</Link>}
    </div>
  );
}
