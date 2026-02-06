"use client"

import { usePage } from "@inertiajs/react"
import {
  Settings2,
  SquareTerminal,
  BookOpen,
  Command,
  AudioWaveform,
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar-trigger"
import { edit as editAppearance } from "@/routes/appearance"

import { DeveloperSidebar } from "./DeveloperSidebar"
import { StaffSidebar } from "./StaffSidebar"

// ✅ FIX PALING PENTING

// ================= DATA =================
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatar/shadcn.jpg",
  },
  teams: [
    { name: "Acount 1", logo: BookOpen, plan: "Enterprise" },
    { name: "Account 2", logo: Command, plan: "Pro" },
    { name: "Account 3", logo: Settings2, plan: "Free" },
    { name: "Account 4.", logo: AudioWaveform, plan: "Startup" },
  ],
  navMain: [
    {
      title: "SiOnline",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Beranda", url: "/dashboard" },
        { title: "Katalog", url: "/katalog" },
        { title: "Keranjang", url: "/keranjang" },
        { title: "Riwayat Pembelian", url: "/history-pembelian" },
        { title: "Settings", url: "/settings/appearance" },
      ],
    },
    {
      title: "Produk",
      icon: BookOpen,
      items: [
        { title: "Kategori", url: "#" },
      ],
    },
  ],
  navMainUser: [
    {
      title: "SiOnline",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Beranda", url: "/dashboard" },
        { title: "Settings", url: editAppearance().url },
      ],
    },
    {
      title: "Produk",
      icon: BookOpen,
      items: [
        { title: "Katalog", url: "katalog" },
        { title: "Keranajang", url: "keranjang" },
        { title: "Riwayat Pembelian", url: "/history-pembelian" },
      ],
    },
  ],
}

// ================= ROLE HANDLER =================
function getSidebarForRole(role?: string) {
  if (role === "developer") {
    return <DeveloperSidebar />
  }
  if (role === "staff") {
    return <StaffSidebar />
  }
  return null
}

function getNavMainForRole(role?: string) {
  if (role === "user") {
    return data.navMainUser
  }
  return data.navMain
}

// ================= COMPONENT =================
export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { auth } = usePage().props as any
  const userRole = auth?.user?.role

  const roleSidebar = getSidebarForRole(userRole)
  if (roleSidebar) {
    return roleSidebar
  }

  const navMain = getNavMainForRole(userRole)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
