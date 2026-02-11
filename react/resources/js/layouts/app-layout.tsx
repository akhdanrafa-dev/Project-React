"use client"

import { type PropsWithChildren } from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar-trigger"
import { Toaster } from "@/components/ui/toasters"
import { AppSidebar } from "@/layouts/app/component/AppSidebar"
import { CartProvider } from "@/layouts/app/context/CartContext"
import { CatalogProvider } from "@/layouts/app/context/CatalogContext"
import { ThemeProvider } from "@/layouts/app/context/ThemeContext"
import type { BreadcrumbItem } from "@/types"

type AppLayoutProps = PropsWithChildren<{
  breadcrumbs?: BreadcrumbItem[]
}>

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <CatalogProvider>
        <CartProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </CartProvider>
      </CatalogProvider>
    </ThemeProvider>
  )
}
