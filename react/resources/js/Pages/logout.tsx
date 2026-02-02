import { router } from "@inertiajs/react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { logout } from "@/routes"

export default function Logout() {
  const handleLogout = () => {
    router.post(logout())
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Logout</h1>
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to logout?
        </p>
        <div className="flex justify-center space-x-4">
          <Button onClick={handleLogout} variant="destructive">
            Yes, Logout
          </Button>
          <Button onClick={() => window.history.back()} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
