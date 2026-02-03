"use client"

import { Link } from "@inertiajs/react"
import React, { ReactNode } from "react"

type SettingsLayoutProps = {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {

  // Sub-menu settings
  const settingsMenu = [
    { title: "Profil", url: "/settings/profile" },
    { title: "Password", url: "/settings/password" },
    { title: "Two Factor Auth", url: "/settings/two-factor" },
    { title: "Appearance", url: "/settings/appearance" },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar kiri */}
      <aside className="w-64 border-r border-muted p-4 flex flex-col gap-4">
        <h2 className="text-lg font-bold">Settings</h2>
        <nav className="flex flex-col gap-2">
          {settingsMenu.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className="px-3 py-2 rounded hover:bg-muted hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Konten */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
