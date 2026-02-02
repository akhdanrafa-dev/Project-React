import { Form, Head } from "@inertiajs/react"
import { useRef, useEffect } from "react"

import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import AppLayout from "@/layouts/app-layout"
import SettingsLayout from "@/Pages/settings/layout"
import { update } from "@/routes/user-password"

export default function Password() {
  return (
    <AppLayout>
      <Head title="Password settings" />

      <SettingsLayout>
        <PasswordForm />
      </SettingsLayout>
    </AppLayout>
  )
}

function PasswordForm() {
  const currentPasswordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentPasswordInputRef.current) {
      currentPasswordInputRef.current.focus()
    }
  }, [])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Password</h1>
        <p className="text-muted-foreground">Change your password here.</p>
      </div>

      <div className="rounded-lg border border-muted bg-card p-6">
        <Form {...update.form()} className="space-y-6">
          {({ processing, errors }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  ref={currentPasswordInputRef}
                  id="current_password"
                  type="password"
                  name="current_password"
                  autoComplete="current-password"
                  className="mt-1 block w-full"
                  placeholder="Enter your current password"
                />
                <InputError message={errors.current_password} className="mt-2" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  className="mt-1 block w-full"
                  placeholder="Enter your new password"
                />
                <InputError message={errors.password} className="mt-2" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">
                  Confirm New Password
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  name="password_confirmation"
                  autoComplete="new-password"
                  className="mt-1 block w-full"
                  placeholder="Confirm your new password"
                />
                <InputError message={errors.password_confirmation} className="mt-2" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={processing}>
                  {processing && <Spinner className="mr-2" />}
                  Update Password
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
