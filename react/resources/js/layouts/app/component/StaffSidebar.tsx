"use client"

import { usePage } from "@inertiajs/react"
import { router } from "@inertiajs/react"
import {
  Settings2,
  Home,
  Package,
  LogOut,
  Settings,
  Command,
  BookOpen,
  AudioWaveform,
  Code2,
  Bell,
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar-trigger"
import { type SharedData } from "@/types"


// Sample data
const data = {
  user: {
    name: "Staff Member",
    email: "staff@example.com",
    avatar: "/avatar/staff.jpg",
  },
  teams: [
    { name: "Staff Account", logo: Command, plan: "Staff" },
  ],
  navMainStaff: [
    {
      title: "Menu Staff",
      isActive: true,
      items: [
        { 
          title: "Beranda", 
          url: "/staff-dashboard",
          icon: Home,
        },
        { 
          title: "Kelola Produk", 
          url: "/kelola-produk",
          icon: Package,
        },
        { 
          title: "Notifikasi Produk", 
          url: "/staff-alerts",
          icon: Bell,
        },
        { 
          title: "Manajemen Developer", 
          url: "/staff/developer-management",
          icon: Code2,
        },
        { 
          title: "Pengaturan", 
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
}

export function StaffSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { auth } = usePage<SharedData>().props

  const handleLogout = () => {
    router.post('/logout')
  }

  const user = auth.user || data.user

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            S
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold">Staff Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMainStaff} />
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-2">
        <NavUser user={{ name: user.name || "Staff", email: user.email || "staff@example.com", avatar: user.avatar || "/avatar/staff.jpg" }} />

      
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
