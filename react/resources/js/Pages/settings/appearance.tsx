"use client"

import { Head } from "@inertiajs/react"

import AppearanceTabs from "@/components/appearance-tabs"
import HeadingSmall from "@/components/heading-small"
import { Separator } from "@/components/ui/separator"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"

export default function Appearance() {
  return (
    <AppLayout>
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
    </AppLayout>
  )
}
