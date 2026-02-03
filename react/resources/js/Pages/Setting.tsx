"use client"

import { Head, usePage } from "@inertiajs/react"

import AdminITLayout from "@/layouts/app/AdminITLayout"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"
import { type SharedData } from "@/types"

export default function Settings() {
  const { auth } = usePage<SharedData>().props
  const Layout = auth.user?.role === 'admin_it' ? AdminITLayout : AppLayout

  return (
    <Layout>
      <Head title="Settings" />

      <SettingsLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </SettingsLayout>
    </Layout>
  )
}
