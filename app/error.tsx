"use client"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[RuralHealth Error]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Something went wrong</h2>
        <p className="text-gray-500 mb-2 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <p className="text-gray-500 mb-6 text-sm">
          For medical emergencies call{" "}
          <a href="tel:108" className="text-red-600 font-bold underline">
            108
          </a>
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
