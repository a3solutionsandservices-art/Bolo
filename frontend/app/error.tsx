"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
          {error.stack && process.env.NODE_ENV === "development" && (
            <pre className="text-xs text-red-700 mt-2 overflow-auto max-h-48 whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
