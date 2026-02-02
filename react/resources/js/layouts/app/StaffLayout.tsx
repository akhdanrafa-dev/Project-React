// StaffLayout.tsx
"use client"

import { type PropsWithChildren } from "react"

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar-trigger"

import { StaffSidebar } from "./component/StaffSidebar"
import { CartProvider } from "./context/CartContext"
import { ThemeProvider } from "./context/ThemeContext"



export default function StaffLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <CartProvider>
        <SidebarProvider>
          <StaffSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </CartProvider>
    </ThemeProvider>
  )
}
