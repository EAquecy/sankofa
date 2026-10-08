"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ userId, initial }: { userId: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => setCount(initial), [initial]);
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("notif-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (p: any) => {
        setCount((c) => c + 1);
        setToast(p.new.title);
        setTimeout(() => setToast(null), 5000);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);
  return (
    <>
      <Link href="/notifications" aria-label={`Notifications, ${count} unread`} className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-redpen px-1 text-center text-[11px] font-bold leading-[18px] text-white">{count > 99 ? "99+" : count}</span>}
      </Link>
      {toast && (
        <Link href="/notifications" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-xl">
          <span className="font-semibold text-ink">New:</span> {toast}
        </Link>
      )}
    </>
  );
}
