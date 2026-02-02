"use client"

import { usePage } from "@inertiajs/react"
import {
  Settings2,
  SquareTerminal,
  BookOpen,
  Command,
  Frame,
  PieChart,
  Map,
  AudioWaveform,
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-project"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar-trigger"

// ✅ FIX PALING PENTING
import { edit as editAppearance } from "@/routes/appearance"

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
        { title: "Katalog", url: "/katalog" },
        { title: "Keranjang", url: "/keranjang" },
        { title: "Riwayat Pembelian", url: "/history-pembelian" },
        { title: "Settings", url: editAppearance().url },
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
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
}

// ================= ROLE HANDLER =================
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

  const navMain = getNavMainForRole(auth?.user?.role)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
