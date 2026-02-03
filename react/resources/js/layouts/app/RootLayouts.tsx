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
import { ThemeProvider } from "./context/ThemeContext"

export default function RootLayout({
  children,
}: PropsWithChildren) {
  const page = usePage()
  const { auth } = page.props as any

  return (
    <ThemeProvider>
      <CartProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
        {auth?.user?.id && <FloatingChatBubble currentUserId={auth.user.id} />}
      </CartProvider>
    </ThemeProvider>
  )
}
