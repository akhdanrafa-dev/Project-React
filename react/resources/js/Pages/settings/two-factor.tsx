"use client"

import { Head } from "@inertiajs/react"

import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"

export default function TwoFactor() {
  return (
    <AppLayout>
      <Head title="Two Factor settings" />

      <SettingsLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Two Factor Authentication</h1>
          <p className="text-muted-foreground">Manage your 2FA settings here.</p>
          {/* Tambahkan form / QR code 2FA */}
        </div>
      </SettingsLayout>
    </AppLayout>
  )
}
