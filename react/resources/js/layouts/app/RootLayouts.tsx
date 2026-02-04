"use client"

import { usePage } from "@inertiajs/react"
import { PropsWithChildren } from "react"

import { FloatingChatBubble } from "@/components/floating-chat-bubble"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar-trigger"
import { Toaster } from "@/components/ui/toasters"

import { AppSidebar } from "./component/AppSidebar"
import { CartProvider } from "./context/CartContext"
import { CatalogProvider } from "./context/CatalogContext"
import { ThemeProvider } from "./context/ThemeContext"

type RootLayoutProps = PropsWithChildren<{
  hideFloatingChat?: boolean
}>

export default function RootLayout({
  children,
  hideFloatingChat = false,
}: RootLayoutProps) {
  const page = usePage()
  const { auth } = page.props as any

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
          {auth?.user?.id && !hideFloatingChat && (
            <FloatingChatBubble currentUserId={auth.user.id} />
          )}
        </CartProvider>
      </CatalogProvider>
    </ThemeProvider>
  )
}
