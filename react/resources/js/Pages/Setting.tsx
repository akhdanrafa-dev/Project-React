"use client"

import { Head } from "@inertiajs/react"

import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"

export default function Settings() {
  return (
    <AppLayout>
      <Head title="Settings" />

      <SettingsLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </SettingsLayout>
    </AppLayout>
  )
}
