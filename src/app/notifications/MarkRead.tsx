"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function MarkRead() {
  const router = useRouter();
  return <button className="btn-ghost btn-sm" onClick={async () => {
    await createClient().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    router.refresh();
  }}>Mark all as read</button>;
}
