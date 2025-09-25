// src/app/layout.tsx
import "./globals.css"
import { AuthProvider } from "@/hooks"  // ✅ clean import

export const metadata = {
  title: "DoroBuddy - Pomodoro Timer",
  description: "A distraction-free Pomodoro timer with task management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* ✅ Wrap children in AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
