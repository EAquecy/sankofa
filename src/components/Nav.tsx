import Link from "next/link";
import { getMe, createClient } from "@/lib/supabase/server";
import NotificationBell from "./NotificationBell";
import { initials } from "@/lib/utils";

export default async function Nav() {
  const me = await getMe();
  let unread = 0;
  if (me) {
    const supabase = await createClient();
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }
  const links =
    !me ? [{ href: "/teachers", label: "Find a teacher" }, { href: "/signup?role=teacher", label: "Teach on Sankofa" }]
    : me.role === "teacher" ? [
        { href: "/studio", label: "Studio" }, { href: "/studio/timetable", label: "Timetable" },
        { href: "/studio/bookings", label: "Bookings" }, { href: "/predict", label: "Predictor" }, { href: "/studio/profile", label: "Profile" }, { href: "/studio/screening", label: "Screening" }]
    : me.role === "admin" ? [{ href: "/admin", label: "Screening queue" }, { href: "/admin/knowledge", label: "Predictor knowledge" }, { href: "/teachers", label: "Public directory" }]
    : [{ href: "/student", label: "My classes" }, { href: "/teachers", label: "Find a teacher" }, { href: "/predict", label: "Predictor" }, { href: "/student/bookings", label: "Bookings" }, { href: "/join", label: "Join with code" }];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href={me ? (me.role === "teacher" ? "/studio" : me.role === "admin" ? "/admin" : "/student") : "/"} className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
          <Logo /> Sankofa
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-[0.92rem] text-muted hover:bg-paper hover:text-text">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {me ? (
            <>
              <NotificationBell userId={me.id} initial={unread} />
              <details className="relative">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{initials(me.full_name)}</summary>
                <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-white p-2 shadow-lg">
                  <div className="px-2 py-1.5">
                    <div className="font-semibold">{me.full_name}</div>
                    <div className="truncate text-xs text-muted">{me.email} · {me.role}</div>
                  </div>
                  <div className="my-1 border-t border-line" />
                  <Link href="/notifications" className="block rounded px-2 py-1.5 text-sm hover:bg-paper">Notifications</Link>
                  <Link href="/account" className="block rounded px-2 py-1.5 text-sm hover:bg-paper">Account</Link>
                  <form action="/auth/signout" method="post">
                    <button className="w-full rounded px-2 py-1.5 text-left text-sm text-redpen hover:bg-paper">Sign out</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">Log in</Link>
              <Link href="/signup" className="btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted hover:bg-paper">{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 28 C6 20 3 14 6 9 C9 4 15 5 16 10 C17 5 23 4 26 9 C29 14 26 20 16 28 Z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M10 13 C10 10 13 10 13.5 12.5" fill="none" stroke="#F2B705" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 13 C22 10 19 10 18.5 12.5" fill="none" stroke="#F2B705" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
