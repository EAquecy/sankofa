import LoginForm from "./LoginForm";
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="h-page">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to see your classes, questions and bookings.</p>
      {sp.error && <p className="mt-4 rounded-md bg-redpen/10 px-3 py-2 text-sm text-redpen">{sp.error}</p>}
      <LoginForm next={sp.next ?? "/dashboard"} />
    </div>
  );
}
