"use client"

import { type PropsWithChildren } from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar-trigger"
import { AppSidebar } from "@/layouts/app/component/AppSidebar"
import { CartProvider } from "@/layouts/app/context/CartContext"
import { ThemeProvider } from "@/layouts/app/context/ThemeContext"

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <CartProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </CartProvider>
    </ThemeProvider>
  )
}
