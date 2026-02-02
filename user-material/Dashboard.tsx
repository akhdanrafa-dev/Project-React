"use client"

import RootLayout from "@/layouts/app/RootLayouts"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, BarChart3, Users } from "lucide-react"
import { router } from "@inertiajs/react"

export default function Dashboard() {
  return (
    <RootLayout>
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Katalog Produk */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Katalog Produk</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 Produk</div>
              <p className="text-xs text-muted-foreground">
                Produk elektronik tersedia
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => router.visit('/katalog')}
              >
                Lihat Katalog
              </Button>
            </CardContent>
          </Card>

          {/* Keranjang */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Keranjang</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 Item</div>
              <p className="text-xs text-muted-foreground">
                Item di keranjang Anda
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => router.visit('/keranjang')}
              >
                Lihat Keranjang
              </Button>
            </CardContent>
          </Card>

          {/* Laporan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Laporan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Lihat</div>
              <p className="text-xs text-muted-foreground">
                Laporan dan statistik
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => router.visit('/laporan')}
              >
                Lihat Laporan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RootLayout>
  )
}
