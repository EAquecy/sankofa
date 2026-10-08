import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login");
  redirect(me.role === "teacher" ? "/studio" : me.role === "admin" ? "/admin" : "/student");
}
