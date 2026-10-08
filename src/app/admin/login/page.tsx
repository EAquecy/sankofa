import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Admin · Sankofa" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const me = await getMe();
  if (me?.role === "admin") redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <div className="font-display text-3xl font-extrabold">Sankofa</div>
          <div className="mt-1 text-white/70">Admin portal</div>
        </div>
        <AdminLoginForm signedInAs={me ? me.email : null} notAdmin={sp.error === "not-admin"} />
      </div>
    </div>
  );
}
