import { createClient } from "@/lib/supabase/server";
import UserTable from "../UserTable";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", { p_role: "student", p_search: q ?? null });
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="h-page">Students</h1>
      <p className="mt-1 text-muted">Everyone preparing for WASSCE on Sankofa. {(data ?? []).length} shown.</p>
      <form className="mt-5 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search name or email" className="input" aria-label="Search" />
        <button className="btn-primary">Search</button>
      </form>
      <UserTable users={data ?? []} kind="student" />
    </div>
  );
}
