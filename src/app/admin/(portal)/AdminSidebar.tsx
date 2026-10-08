"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/screening", label: "Teacher screening" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/knowledge", label: "Predictor knowledge" },
  { href: "/admin/credits", label: "AI credits" },
];

export default function AdminSidebar({ name, email }: { name: string; email: string }) {
  const path = usePathname();
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));
  return (
    <aside className="sticky top-0 z-30 border-b border-white/10 bg-ink text-white lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
        <Link href="/admin" className="block font-display text-xl font-extrabold">Sankofa <span className="font-sans text-sm font-normal text-white/60">Admin</span></Link>
        <form action="/auth/signout" method="post" className="lg:hidden"><button className="text-sm text-white/70 underline">Sign out</button></form>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
            className={`shrink-0 rounded-md px-3 py-2 text-[0.95rem] ${active(l.href) ? "bg-white font-semibold text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>{l.label}</Link>
        ))}
      </nav>
      <div className="absolute bottom-0 hidden w-full border-t border-white/10 p-5 lg:block">
        <div className="truncate text-sm font-semibold">{name}</div>
        <div className="truncate text-xs text-white/60">{email}</div>
        <div className="mt-3 flex gap-3 text-sm">
          <Link href="/" className="text-white/70 underline hover:text-white">View site</Link>
          <form action="/auth/signout" method="post"><button className="text-white/70 underline hover:text-white">Sign out</button></form>
        </div>
      </div>
    </aside>
  );
}
