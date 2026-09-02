import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"

import { AppShell } from "@/components/app-shell"
import { getWorkspaceStatus } from "@/lib/workspace/status"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
})

export const metadata: Metadata = {
  title: "Playbook Iterator",
  description:
    "A decision-support application for Sales Engineering leaders. Keep an explicit playbook, record exceptions, and evolve the standard from evidence.",
}

export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const status = await getWorkspaceStatus()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell
          workspaceName={status.workspaceName}
          persistenceLabel={status.persistence}
          isDemo={status.isDemo}
        >
          {children}
        </AppShell>
      </body>
    </html>
  )
}
