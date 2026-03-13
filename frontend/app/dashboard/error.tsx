"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">{error.message || "An unexpected error occurred"}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Sign in again
          </button>
        </div>
      </div>
    </div>
  );
}
