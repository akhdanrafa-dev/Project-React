"use client"

import { Head, usePage } from "@inertiajs/react"

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

            <p className="text-sm text-muted-foreground">
              Default theme is light. Your preference will be saved.
            </p>
          </div>
        </div>
      </SettingsLayout>
    </Layout>
  )
}
