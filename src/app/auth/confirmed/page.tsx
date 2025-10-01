"use client"
import { useEffect } from "react"
import Link from "next/link"

export default function Confirmed() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      // clear hash before supabase can read it
      window.history.replaceState({}, document.title, "/auth/confirmed")
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="rounded-xl bg-white p-6 shadow-md text-center">
        <h1 className="text-xl font-bold">✅ Your email has been confirmed successfully!</h1>
        <p className="mt-4">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Go to Login
          </Link>
        </p>
      </div>
    </div>
  )
}