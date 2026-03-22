"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white">
        <div className="flex h-screen items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-neutral-400 mb-6">
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
