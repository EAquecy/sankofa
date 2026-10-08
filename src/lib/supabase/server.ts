import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}

export type Me = { id: string; email: string; role: "student" | "teacher" | "admin"; full_name: string; avatar_url: string | null; teacher_status?: string | null };

export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from("profiles").select("id, role, full_name, avatar_url").eq("id", user.id).single();
  if (!p) return null;
  let teacher_status = null;
  if (p.role === "teacher") {
    const { data: t } = await supabase.from("teacher_profiles").select("status").eq("id", user.id).single();
    teacher_status = t?.status ?? null;
  }
  return { ...p, email: user.email ?? "", teacher_status } as Me;
});
