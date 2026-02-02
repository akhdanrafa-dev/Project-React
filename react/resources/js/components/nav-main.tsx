"use client"

import { Link, usePage } from "@inertiajs/react"
import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar-trigger"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  url: string
}

type NavGroup = {
  title: string
  icon?: React.ElementType
  items: NavItem[]
}

export function NavMain({ items }: { items: NavGroup[] }) {
  const { url } = usePage()

  return (
    <>
      {items.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel className="flex items-center gap-2">
            {group.icon && <group.icon className="h-4 w-4" />}
            {group.title}
          </SidebarGroupLabel>

          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = url.startsWith(item.url)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={item.url}
                      className={cn("w-full", isActive && "font-semibold")}
                    >
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
