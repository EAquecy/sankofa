export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const WEEKEND = ["Saturday", "Sunday"];
export const TZ = "Africa/Accra";

export function fmtDateTime(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}
export function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(new Date(d));
}
export function fmtTime(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}
export function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
}
export function cedis(n: number | string | null | undefined) {
  return `GH₵${Number(n ?? 0).toFixed(2).replace(/\.00$/, "")}`;
}
export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}
export function publicUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
export function hhmm(t: string) { return t?.slice(0, 5); }
/** Accra is UTC+0 year round, so local datetime-input values map 1:1 to UTC */
export function localInputToISO(v: string) { return new Date(v + ":00Z").toISOString(); }
