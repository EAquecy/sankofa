import { redirect } from "next/navigation";
import { createClient, getMe } from "@/lib/supabase/server";
import AccountForm from "./AccountForm";
export default async function Page() {
  const me = await getMe();
  if (!me) redirect("/login?next=/account");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name, school, exam_year").eq("id", me.id).single();
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="h-page">Account</h1>
      <AccountForm id={me.id} role={me.role} initial={data ?? { full_name: me.full_name, school: "", exam_year: null }} />
    </div>
  );
}
