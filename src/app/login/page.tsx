import LoginForm from "./LoginForm";
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; notice?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="h-page">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to see your classes, questions and bookings.</p>
      {sp.notice === "confirmed" && <p className="mt-4 rounded-md bg-green/10 px-3 py-2 text-sm text-green">Your email is confirmed. Log in to continue.</p>}
      {sp.notice === "link-used" && <p className="mt-4 rounded-md bg-gold/20 px-3 py-2 text-sm">That confirmation link has already been used. If you clicked it before, your account is active. Log in below.</p>}
      {sp.error && <p className="mt-4 rounded-md bg-redpen/10 px-3 py-2 text-sm text-redpen">{sp.error}</p>}
      <LoginForm next={sp.next ?? "/dashboard"} />
    </div>
  );
}
