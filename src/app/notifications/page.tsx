import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import MarkRead from "./MarkRead";

const ICON: Record<string, string> = { session: "bg-ink", question: "bg-gold", answer: "bg-green", booking: "bg-redpen", assignment: "bg-ink-soft", submission: "bg-ink-soft", grade: "bg-green", screening: "bg-gold", enrollment: "bg-muted" };

export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between"><h1 className="h-page">Notifications</h1>{unread > 0 && <MarkRead />}</div>
      <div className="panel mt-6 divide-y divide-line">
        {(data ?? []).length === 0 && <p className="p-8 text-center text-muted">Nothing yet. Class reminders, answers and booking updates will show up here.</p>}
        {(data ?? []).map((n) => (
          <Link key={n.id} href={n.link ?? "#"} className={`flex gap-3 p-4 hover:bg-paper ${n.read_at ? "" : "bg-ink/[0.03]"}`}>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? "bg-line" : ICON[n.kind] ?? "bg-ink"}`} />
            <div className="min-w-0 flex-1">
              <div className={n.read_at ? "" : "font-semibold"}>{n.title}</div>
              {n.body && <div className="truncate text-sm text-muted">{n.body}</div>}
            </div>
            <span className="shrink-0 text-xs text-muted">{timeAgo(n.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
