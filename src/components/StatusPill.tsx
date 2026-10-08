const C: Record<string, string> = {
  pending: "bg-gold/20 text-[#7a5a00]", confirmed: "bg-green/10 text-green", completed: "bg-ink/10 text-ink",
  declined: "bg-redpen/10 text-redpen", cancelled: "bg-line text-muted",
  draft: "bg-line text-muted", approved: "bg-green/10 text-green", rejected: "bg-redpen/10 text-redpen",
};
export default function StatusPill({ s }: { s: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${C[s] ?? "bg-line"}`}>{s}</span>;
}
