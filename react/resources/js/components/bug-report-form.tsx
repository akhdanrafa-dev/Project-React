import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

interface BugReportFormProps {
  onSuccess?: () => void
}

export function BugReportForm({ onSuccess }: BugReportFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleOpenDialog = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      toast({
        title: "📝 Form Laporan Terbuka",
        description: "Silakan isi formulir untuk melaporkan masalah, saran, atau keluhan Anda",
        duration: 3000,
      })
    }
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "bug",
    priority: "medium",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast({
        title: "⚠️ Data Tidak Lengkap",
        description: "Mohon isi semua field yang diperlukan",
        duration: 3000,
      })
      return
    }

    setLoading(true)

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content")
      if (csrfToken) {
        headers["X-CSRF-TOKEN"] = csrfToken
      }

      const response = await fetch("/api/bug-tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMsg = "Gagal mengirim laporan"
        if (data.message) {
          errorMsg = data.message
        } else if (data.errors) {
          errorMsg = Object.values(data.errors).flat().join(", ")
        }
        console.error("Response error:", data)
        throw new Error(errorMsg)
      }

      if (!data.success && data.message) {
        throw new Error(data.message)
      }

      const ticketId = data.id || data.data?.id
      const ticketNumber = data.data?.ticket_number || data.ticket_number || `#${ticketId}`
      toast({
        title: "✅ Laporan Berhasil Dikirim!",
        description: `No. Tiket: ${ticketNumber} | Judul: ${formData.title}`,
        duration: 5000,
      })

      console.log("Laporan berhasil dikirim:", data)

      setFormData({
        title: "",
        description: "",
        category: "bug",
        priority: "medium",
      })

      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error mengirim laporan:", error)
      toast({
        title: "❌ Gagal Mengirim Laporan",
        description: error.message || "Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950"
          title="Laporkan masalah"
        >
          <AlertCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Laporkan Masalah
          </DialogTitle>
          <DialogDescription>
            Bantu kami memperbaiki layanan dengan melaporkan bug, memberikan feedback, atau mengajukan keluhan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Jenis Laporan</Label>
            <Select value={formData.category} onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Bug/Masalah Teknis</SelectItem>
                <SelectItem value="feedback">💡 Saran/Feedback</SelectItem>
                <SelectItem value="complaint">😞 Keluhan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioritas</Label>
            <Select value={formData.priority} onValueChange={(value) =>
              setFormData({ ...formData, priority: value })
            }>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              placeholder="Berikan judul singkat untuk laporan Anda"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail masalah atau saran Anda..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={5}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
