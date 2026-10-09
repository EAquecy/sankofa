import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase confirms the email before redirecting here. If the session exchange fails
// (link opened in a different browser or device, or opened twice), the account is still
// confirmed, so send the person to log in instead of showing an error.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const err = searchParams.get("error_description");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/dashboard`);
  }
  if (err && /expired|invalid/i.test(err)) return NextResponse.redirect(`${origin}/login?notice=link-used`);
  return NextResponse.redirect(`${origin}/login?notice=confirmed`);
}
