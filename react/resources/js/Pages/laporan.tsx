import { AppSidebar } from "@/components/app-sidebar"
import { BugReportTable } from "@/components/bug-report-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar-trigger"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Laporan Bug</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Kelola dan pantau laporan bug yang masuk dari user
                  </p>
                </div>
              </div>
              <BugReportTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
