import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 p-10 shadow-2xl ring-1 ring-slate-800">
        <h1 className="text-3xl font-bold text-slate-100">Create an account</h1>

        {params.error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 ring-1 ring-emerald-500/20">
            {params.message}
          </p>
        )}

        <SignupForm />
      </div>
    </main>
  );
}
