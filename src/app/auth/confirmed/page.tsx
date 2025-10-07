"use client"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function Confirmed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Email Confirmed Successfully!
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account has been verified. You can now sign in to DoroBuddy.
          </p>
          <div className="mt-8">
            <Link 
              href="/login" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Continue to Login
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Your email has been confirmed and your account is ready to use.
          </p>
        </div>
      </div>
    </div>
  )
}