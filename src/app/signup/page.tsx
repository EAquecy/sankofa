import SignupForm from "./SignupForm";
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="h-page">Create your account</h1>
      <p className="mt-2 text-muted">Students learn. Teachers teach. Pick the one that fits you.</p>
      <SignupForm initialRole={sp.role === "teacher" ? "teacher" : "student"} />
    </div>
  );
}
