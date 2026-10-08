import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
export default async function L({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login?next=/studio");
  if (me.role !== "teacher") redirect("/dashboard");
  return <>{children}</>;
}
