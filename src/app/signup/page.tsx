import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>

        {params.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
            {params.message}
          </p>
        )}

        <SignupForm />
      </div>
    </main>
  );
}
