"use client"

import { usePage } from "@inertiajs/react"
import {
  Code2,
  Home,
  TrendingUp,
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar-trigger"
import { type SharedData } from "@/types"

const data = {
  navMainDeveloper: [
    {
      title: "Menu Developer",
      isActive: true,
      items: [
        { title: "Beranda", url: "/developer-dashboard", icon: Home },
        { title: "Kelola Pengguna", url: "/developer/api" },
        { title: "Laporan", url: "/laporan" },
        { title: "History Ditutup", url: "/developer/history-laporan-ditutup" },
        { title: "Pantau Produk", url: "/developer/pantau-produk" },
        { title: "Manajemen Staff", url: "/developer/debug" },
        { title: "Ranking Admin", url: "/admin-it/ranking-admin", icon: TrendingUp },
        { title: "Pengaturan", url: "/settings" },
      ],
    },
  ],
}

export function DeveloperSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { auth } = usePage<SharedData>().props

  const user = {
    name: auth.user?.name || "Developer",
    email: auth.user?.email || "developer@example.com",
    avatar: auth.user?.avatar || "/avatar/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Code2 className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Developer Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMainDeveloper} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
