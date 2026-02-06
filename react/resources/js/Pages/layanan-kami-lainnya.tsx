"use client"

import { router } from "@inertiajs/react"
import { ExternalLink } from "lucide-react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import RootLayout from "@/layouts/app/RootLayouts"

function LayananKamiLainnyaContent() {
  const services = [
    {
      title: "SiOnline Support",
      description: "Dapatkan bantuan dan dukungan teknis untuk semua layanan SiOnline.",
      image: "/logo.svg", // Placeholder image
      url: "https://support.sionline.com",
    },
    {
      title: "SiOnline Academy",
      description: "Pelajari lebih lanjut tentang produk dan layanan kami melalui kursus online.",
      image: "/logo.svg", // Placeholder image
      url: "https://academy.sionline.com",
    },
    {
      title: "SiOnline Community",
      description: "Bergabung dengan komunitas pengguna SiOnline untuk berbagi pengalaman.",
      image: "/logo.svg", // Placeholder image
      url: "https://community.sionline.com",
    },
    {
      title: "SiOnline Blog",
      description: "Baca artikel terbaru tentang teknologi dan inovasi dari SiOnline.",
      image: "/logo.svg", // Placeholder image
      url: "https://blog.sionline.com",
    },
  ]

  return (
    <>
      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/layanan-kami-lainnya">Layanan Kami Lainnya</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Layanan Kami Lainnya</h1>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="flex-1">
                    {service.description}
                  </CardDescription>
                </div>
                <Button
                  className="w-full"
                  onClick={() => window.open(service.url, '_blank')}
                >
                  Kunjungi
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

export default function LayananKamiLainnya() {
  return (
    <RootLayout>
      <LayananKamiLainnyaContent />
    </RootLayout>
  )
}
