// DeveloperLayout.tsx
"use client"

import { type PropsWithChildren } from "react"

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar-trigger"

import { DeveloperSidebar } from "./component/DeveloperSidebar"
import { ThemeProvider } from "./context/ThemeContext"



export default function DeveloperLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <DeveloperSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}
