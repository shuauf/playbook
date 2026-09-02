import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"

import { persistenceCaption } from "@/lib/db"

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-[oklch(0.965_0.012_85)]/90 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1440px] items-start justify-between gap-4 px-4 py-4 md:px-8">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-[oklch(0.42_0.06_175)] uppercase">
                Northstar SE
              </p>
              <p className="font-heading text-[1.65rem] leading-none text-foreground">
                Playbook Iterator
              </p>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Exceptions are decisions. The playbook evolves from evidence.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[oklch(0.55_0.12_145)]" />
              {persistenceCaption()}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
        <footer className="border-t border-border/80">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-1 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
            <p>Phase 1 of the rebuild: domain model, migrations, and development data.</p>
            <p>Playbook Health is the intended landing page.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
