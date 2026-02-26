"use client"

import { Head, usePage } from "@inertiajs/react"

import AppearanceColorThemes from "@/components/appearance-color-themes"
import AppearanceTabs from "@/components/appearance-tabs"
import HeadingSmall from "@/components/heading-small"
import { Separator } from "@/components/ui/separator"
import AdminITLayout from "@/layouts/app/AdminITLayout"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"
import type { SharedData } from "@/types"

export default function Appearance() {
  const { auth } = usePage<SharedData>().props
  const Layout = auth.user?.role === 'admin_it' ? AdminITLayout : AppLayout

  return (
    <Layout>
      <Head title="Appearance settings" />

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title="Appearance settings"
            description="Customize how the application looks for you"
          />

          <div className="space-y-4">
            <AppearanceTabs />

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Color Theme</h3>
              <p className="text-sm text-muted-foreground">
                Pilih kombinasi warna favorit. Tema ini berlaku untuk semua role di browser ini.
              </p>
              <AppearanceColorThemes />
            </div>

            <Separator />

            <p className="text-sm text-muted-foreground">
              Pengaturan mode dan warna akan otomatis disimpan.
            </p>
          </div>
        </div>
      </SettingsLayout>
    </Layout>
  )
}
