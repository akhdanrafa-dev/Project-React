import { Form, Head, usePage } from "@inertiajs/react"
import { useRef, useEffect } from "react"

import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import AdminITLayout from "@/layouts/app/AdminITLayout"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"
import { update } from "@/routes/profile"
import type { SharedData } from "@/types"

export default function Profile() {
  const { auth } = usePage<SharedData>().props
  const Layout = auth.user?.role === 'admin_it' ? AdminITLayout : AppLayout

  return (
    <Layout>
      <Head title="Profile settings" />

      <SettingsLayout>
        <ProfileForm />
      </SettingsLayout>
    </Layout>
  )
}

function ProfileForm() {
  const { auth } = usePage<SharedData>().props
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information here.</p>
      </div>

      <div className="rounded-lg border border-muted bg-card p-6">
        <Form {...update.form()} className="space-y-6">
          {({ processing, errors }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Username</Label>
                <Input
                  ref={nameInputRef}
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  defaultValue={auth.user.name}
                  className="mt-1 block w-full"
                  placeholder="Your name"
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  defaultValue={auth.user.email}
                  className="mt-1 block w-full"
                  placeholder="your.email@example.com"
                />
                <InputError message={errors.email} className="mt-2" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={processing}>
                  {processing && <Spinner className="mr-2" />}
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
