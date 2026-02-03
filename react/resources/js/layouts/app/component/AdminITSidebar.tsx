"use client"

import { usePage } from "@inertiajs/react"
import {
  Home,
  Ticket,
  BarChart3,
  Users,
  Settings,
  MessageSquare,
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
  user: {
    name: "Admin IT",
    email: "admin@example.com",
    avatar: "/avatar/admin.jpg",
  },
  navMainAdminIT: [
    {
      title: "Navigation",
      isActive: true,
      items: [
        { 
          title: "Dashboard", 
          url: "/admin-it-dashboard",
          icon: Home,
        },
        { 
          title: "Laporan Tiket", 
          url: "/admin-it/tickets",
          icon: Ticket,
        },
        { 
          title: "Chat", 
          url: "/admin-it/chats",
          icon: MessageSquare,
        },
        { 
          title: "Statistik", 
          url: "/admin-it/statistics",
          icon: BarChart3,
        },
        { 
          title: "Profil", 
          url: "/admin-it/profile",
          icon: Users,
        },
        { 
          title: "Settings", 
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
    projects: [
    { name: "Design Engineering", url: "#", },
    { name: "Sales & Marketing", url: "#",  },
    { name: "Travel", url: "#", icon: Map },
  ],
}

export function AdminITSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { auth } = usePage<SharedData>().props

  const user = auth.user || data.user

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
            IT
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold">Admin IT Panel</span>
            <span className="text-xs text-muted-foreground">v1.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMainAdminIT} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: user.name || "Admin IT", email: user.email || "admin@example.com", avatar: "/avatar/admin.jpg" }} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
