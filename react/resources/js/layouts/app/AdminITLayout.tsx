import { type PropsWithChildren } from "react"

import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar-trigger"

import { AdminITSidebar } from "./component/AdminITSidebar"
import { ThemeProvider } from "./context/ThemeContext"

export default function AdminITLayout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AdminITSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}
