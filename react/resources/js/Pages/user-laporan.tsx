import { useState, useEffect } from "react"import { useState, useEffect } from "react"
































































































































































































































































}  )    </div>      </Card>        </CardContent>          </div>            Total: {filteredTickets.length} laporan bug          <div className="text-sm text-muted-foreground">          )}            </div>              </Table>                </TableBody>                  )}                    </TableRow>                      </TableCell>                        Anda belum memiliki laporan bug                      <TableCell colSpan={8} className="text-center py-8">                    <TableRow>                  ) : (                    ))                      </TableRow>                        </TableCell>                          )}                            <Badge variant="secondary">Belum di handle</Badge>                          ) : (                            <span className="text-sm">{ticket.assignedAdmin.name}</span>                          {ticket.assignedAdmin ? (                        <TableCell>                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>                        </TableCell>                          {getDifficultyBadge(ticket.difficulty_level)}                        <TableCell>                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>                        </TableCell>                          {ticket.ticket_number}                        <TableCell className="font-mono text-sm">                        </TableCell>                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}                        <TableCell>                        <TableCell>{ticket.title}</TableCell>                        <TableCell className="font-medium">{ticket.id}</TableCell>                      <TableRow key={ticket.id}>                    filteredTickets.map((ticket) => (                  {filteredTickets && filteredTickets.length > 0 ? (                <TableBody>                </TableHeader>                  </TableRow>                    <TableHead>Handle By</TableHead>                    <TableHead>Status</TableHead>                    <TableHead>Tingkat Kesulitan</TableHead>                    <TableHead>Prioritas</TableHead>                    <TableHead>Nomor Tiket</TableHead>                    <TableHead>Tanggal</TableHead>                    <TableHead>Judul</TableHead>                    <TableHead className="w-12">Id</TableHead>                  <TableRow>                <TableHeader>              <Table>            <div className="rounded-lg border overflow-x-auto">          ) : (            </div>              <Loader2 className="h-8 w-8 animate-spin" />            <div className="flex items-center justify-center py-8">          {loading ? (          <Separator />          </div>            />              className="max-w-sm"              onChange={(e) => setSearchQuery(e.target.value)}              value={searchQuery}              placeholder="Cari berdasarkan nomor tiket atau judul..."            <Input          <div className="flex items-center gap-2">        <CardContent className="space-y-4">        </CardHeader>          <CardTitle>Laporan Bug Saya</CardTitle>        <CardHeader>      <Card>      </div>        </Breadcrumb>          </BreadcrumbList>            </BreadcrumbItem>              <span>Laporan</span>            <BreadcrumbItem>            <BreadcrumbSeparator />            </BreadcrumbItem>              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>            <BreadcrumbItem>            <BreadcrumbSeparator />            </BreadcrumbItem>              <SidebarTrigger />            <BreadcrumbItem>          <BreadcrumbList>        <Breadcrumb>      <div className="flex items-center justify-between">    <div className="flex flex-col gap-4">  return (    })      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()      if (priorityDiff !== 0) return priorityDiff      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority)    .sort((a, b) => {    )        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase())        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||      (ticket) =>    .filter(  const filteredTickets = tickets  }    }        return <Badge className="bg-gray-100 text-gray-800">-</Badge>      default:        return <Badge className="bg-red-100 text-red-800">Susah</Badge>      case "hard":        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>      case "medium":        return <Badge className="bg-green-100 text-green-800">Mudah</Badge>      case "easy":    switch (difficulty?.toLowerCase()) {  const getDifficultyBadge = (difficulty?: string) => {  }    }        return <Badge>{status}</Badge>      default:        return <Badge className="bg-gray-500">Ditutup</Badge>      case "closed":        return <Badge className="bg-green-500">Selesai</Badge>      case "resolved":        return <Badge className="bg-blue-500">Dalam Proses</Badge>      case "in_progress":        return <Badge variant="outline">Terbuka</Badge>      case "open":    switch (status?.toLowerCase()) {  const getStatusBadge = (status: string) => {  }    }        return <Badge>{priority}</Badge>      default:        return <Badge variant="secondary">Rendah</Badge>      case "low":        return <Badge variant="default">Sedang</Badge>      case "medium":        return <Badge variant="destructive">Tinggi</Badge>      case "high":    switch (priority?.toLowerCase()) {  const getPriorityBadge = (priority: string) => {  }    }        return 0      default:        return 1      case "low":        return 2      case "medium":        return 3      case "high":    switch (priority?.toLowerCase()) {  const getPriorityValue = (priority: string) => {  }    }      setLoading(false)    } finally {      })        variant: "destructive",        description: "Gagal mengambil data ticket",        title: "Error",      toast({    } catch (error) {      setTickets(userTickets)      const userTickets = data.filter((ticket: BugTicket) => ticket.user_id === auth.user.id)      // Filter hanya laporan milik user yang login      const data = await response.json()      if (!response.ok) throw new Error("Gagal mengambil ticket")      const response = await fetch("/api/bug-tickets")    try {    setLoading(true)  const fetchTickets = async () => {  }, [])    fetchTickets()  useEffect(() => {  const [searchQuery, setSearchQuery] = useState("")  const [loading, setLoading] = useState(false)  const [tickets, setTickets] = useState<BugTicket[]>([])  const { toast } = useToast()  const { auth } = page.props as any  const page = usePage()function UserLaporanContent() {}  )    </RootLayout>      <UserLaporanContent />    <RootLayout>  return (export default function UserLaporanPage() {}  } | null    name: string    id: number  assignedAdmin?: {  }    phone?: string    email: string    name: string    id: number  user?: {  created_at: string  assigned_to?: number | null  user_id: number  status: string  difficulty_level?: string  priority: string  title: string  ticket_number: string  id: numberinterface BugTicket {import { Loader2 } from "lucide-react"import RootLayout from "@/layouts/app/RootLayouts"import { useToast } from "@/components/ui/use-toast"import { SidebarTrigger } from "@/components/ui/sidebar-trigger"import { Separator } from "@/components/ui/separator"import { Input } from "@/components/ui/input"import { Badge } from "@/components/ui/badge"import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"} from "@/components/ui/table"  TableRow,  TableHeader,  TableHead,  TableCell,  TableBody,  Table,import {} from "@/components/ui/breadcrumb"  BreadcrumbSeparator,  BreadcrumbList,  BreadcrumbLink,  BreadcrumbItem,  Breadcrumb,import {import { usePage } from "@inertiajs/react"import { usePage } from "@inertiajs/react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import RootLayout from "@/layouts/app/RootLayouts"
import { Loader2 } from "lucide-react"

interface BugTicket {
  id: number
  ticket_number: string
  title: string
  priority: string
  difficulty_level?: string
  status: string
  user_id: number
  assigned_to?: number | null
  created_at: string
  user?: {
    id: number
    name: string
    email: string
    phone?: string
  }
  assignedAdmin?: {
    id: number
    name: string
  } | null
}

export default function UserLaporanPage() {
  return (
    <RootLayout>
      <UserLaporanContent />
    </RootLayout>
  )
}

function UserLaporanContent() {
  const page = usePage()
  const { auth } = page.props as any
  const { toast } = useToast()
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bug-tickets")
      if (!response.ok) throw new Error("Gagal mengambil ticket")

      const data = await response.json()
      // Filter hanya laporan milik user yang login
      const userTickets = data.filter((ticket: BugTicket) => ticket.user_id === auth.user.id)
      setTickets(userTickets)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data ticket",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriorityValue = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return 3
      case "medium":
        return 2
      case "low":
        return 1
      default:
        return 0
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <Badge variant="destructive">Tinggi</Badge>
      case "medium":
        return <Badge variant="default">Sedang</Badge>
      case "low":
        return <Badge variant="secondary">Rendah</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <Badge variant="outline">Terbuka</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">Dalam Proses</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Selesai</Badge>
      case "closed":
        return <Badge className="bg-gray-500">Ditutup</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return <Badge className="bg-green-100 text-green-800">Mudah</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>
      case "hard":
        return <Badge className="bg-red-100 text-red-800">Susah</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">-</Badge>
    }
  }

  const filteredTickets = tickets
    .filter(
      (ticket) =>
        ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Urutkan berdasarkan prioritas (tinggi ke rendah)
      const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      // Jika prioritas sama, urutkan berdasarkan waktu (yang terbaru di atas)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <SidebarTrigger />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span>Laporan</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Bug Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cari berdasarkan nomor tiket atau judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Separator />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Id</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nomor Tiket</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Tingkat Kesulitan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handle By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets && filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.title}</TableCell>
                        <TableCell>
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>
                          {getDifficultyBadge(ticket.difficulty_level)}
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {ticket.assignedAdmin ? (
                            <span className="text-sm">{ticket.assignedAdmin.name}</span>
                          ) : (
                            <Badge variant="secondary">Belum di handle</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Anda belum memiliki laporan bug
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Total: {filteredTickets.length} laporan bug
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
