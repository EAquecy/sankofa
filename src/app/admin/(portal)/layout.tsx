import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

export default async function L({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/admin/login");
  if (me.role !== "admin") redirect("/admin/login?error=not-admin");
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15rem_1fr]">
      <AdminSidebar name={me.full_name} email={me.email} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
