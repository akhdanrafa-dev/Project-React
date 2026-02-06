"use client"

import {
  Code2,
  Home,
  TrendingUp,
} from "lucide-react"
import * as React from "react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar-trigger"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatar/shadcn.jpg",
  },
  navMainDeveloper: [
    {
      title: "Developer Tools",
      icon: Code2,
      isActive: true,
      items: [
        { title: "Beranda", url: "/developer-dashboard", icon: Home },
        { title: "Kelola Pengguna", url: "/developer/api" },
        { title: "Laporan", url: "/developer/tools" },
        { title: "Pantau Produk", url: "/developer/integration" },
        { title: "Manajemen Staff", url: "/developer/debug" },
        { title: "Performance", url: "/developer/performance" },
        { title: "Ranking Admin", url: "/admin-it/rankings", icon: TrendingUp },
        { title: "Settings", url: "/settings" },
      ],
    },
  ],
}

export function DeveloperSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
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
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
