"use client"

import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cyan-50/50 to-white">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
        <Loader2 className="h-6 w-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <p className="mt-4 text-sm text-gray-500 animate-pulse">Loading...</p>
    </div>
  )
}
