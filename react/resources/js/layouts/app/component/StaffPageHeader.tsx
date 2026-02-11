import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"

type StaffBreadcrumbItem = {
  label: string
  href: string
}

type StaffPageHeaderProps = {
  items: StaffBreadcrumbItem[]
}

export function StaffPageHeader({ items }: StaffPageHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item) => (
            <BreadcrumbItem key={`${item.href}-${item.label}`}>
              <BreadcrumbLink href={item.href}>
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
