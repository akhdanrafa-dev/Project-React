"use client"

import { usePage } from "@inertiajs/react"
import {
  Code2,
  Frame,
  PieChart,
  Map,
  Home,
  TrendingUp,
} from "lucide-react"
import * as React from "react"


import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-project"
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
        { title: "Home", url: "/developer-dashboard", icon: Home },
        { title: "Kelola Pengguna", url: "/developer/api" },
        { title: "Laporan", url: "/developer/tools" },
        { title: "Integration", url: "/developer/integration" },
        { title: "Debugging", url: "/developer/debug" },
        { title: "Performance", url: "/developer/performance" },
        { title: "Ranking Admin", url: "/admin-it/rankings", icon: TrendingUp },
        { title: "Settings", url: "/settings" },
      ],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
}

export function DeveloperSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { auth } = usePage<SharedData>().props

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
        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
