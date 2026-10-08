import Link from "next/link";
import { initials, cedis } from "@/lib/utils";

export default function TeacherCard({ t }: { t: any }) {
  const name = t.profiles?.full_name ?? "Teacher";
  const subjects: string[] = (t.teacher_subjects ?? []).map((s: any) => s.subjects?.name).filter(Boolean);
  return (
    <Link href={`/teachers/${t.id}`} className="group flex flex-col rounded-xl border border-line bg-white p-5 hover:border-ink/40">
      <div className="flex items-center gap-3">
        {t.profiles?.avatar_url
          ? <img src={t.profiles.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-white">{initials(name)}</span>}
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold group-hover:text-ink">{name}</div>
          <div className="truncate text-sm text-muted">{t.headline || "Screened Sankofa teacher"}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {subjects.map((s) => <span key={s} className="chip">{s}</span>)}
      </div>
      <div className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-muted">{t.years_experience ? `${t.years_experience} yrs teaching` : "New to teaching"}</span>
        <span className="font-semibold">{cedis(t.private_rate)}<span className="font-normal text-muted">/hr private</span></span>
      </div>
    </Link>
  );
}
