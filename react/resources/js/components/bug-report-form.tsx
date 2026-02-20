import { AlertCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Toggle } from "@/components/ui/toggle"
import { useToast } from "@/components/ui/use-toast"

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
    urgency_reason: "",
  })

  const isFeedback = formData.category === "feedback"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isFeedback) {
      if (!formData.description) {
        toast({
          title: "⚠️ Data Tidak Lengkap",
          description: "Mohon isi konten masukan Anda",
          duration: 3000,
        })
        return
      }
    } else {
      if (!formData.title || !formData.description) {
        toast({
          title: "⚠️ Data Tidak Lengkap",
          description: "Mohon isi semua field yang diperlukan",
          duration: 3000,
        })
        return
      }

      if (formData.priority === "high" && !formData.urgency_reason.trim()) {
        toast({
          title: "⚠️ Alasan Prioritas Tinggi Diperlukan",
          description: "Mohon jelaskan alasan mengapa Anda memilih prioritas tinggi",
          duration: 3000,
        })
        return
      }
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

      const endpoint = isFeedback ? "/api/feedbacks" : "/api/bug-tickets"
      const requestBody = isFeedback
        ? { message: formData.description, type: formData.category === 'complaint' ? 'keluhan' : formData.category }
        : formData

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMsg = isFeedback ? "Gagal mengirim masukan" : "Gagal mengirim laporan"
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

      if (isFeedback) {
        toast({
          title: "✅ Masukan Berhasil Disimpan!",
          description: "Terima kasih atas masukan Anda. Masukan anda sangat berarti bagi kami.",
          duration: 5000,
        })
      } else {
        const ticketId = data.id || data.data?.id
        const ticketNumber = data.data?.ticket_number || data.ticket_number || `#${ticketId}`
        toast({
          title: "✅ Laporan Berhasil Dikirim!",
          description: `No. Tiket: ${ticketNumber} | Judul: ${formData.title}`,
          duration: 5000,
        })
      }

      console.log("Laporan berhasil dikirim:", data)

      setFormData({
        title: "",
        description: "",
        category: "bug",
        priority: "medium",
        urgency_reason: "",
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
      <Toggle
        pressed={open}
        onPressedChange={handleOpenDialog}
        variant="outline"
        className="rounded-full px-4 hover:bg-blue-50 dark:hover:bg-blue-950"
        aria-label="Buat laporan"
      >
        Buat Laporan
      </Toggle>

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

          {!isFeedback && (
            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select value={formData.priority} onValueChange={(value) =>
                setFormData({ ...formData, priority: value, urgency_reason: value === "high" ? formData.urgency_reason : "" })
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
          )}

          {!isFeedback && formData.priority === "high" && (
            <div className="space-y-2 p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
              <Label htmlFor="urgency_reason">Alasan Prioritas Tinggi <span className="text-red-500">*</span></Label>
              <Textarea
                id="urgency_reason"
                placeholder="Jelaskan mengapa Anda membutuhkan perbaikan/respons segera..."
                value={formData.urgency_reason}
                onChange={(e) =>
                  setFormData({ ...formData, urgency_reason: e.target.value })
                }
                rows={3}
              />
            </div>
          )}

          {!isFeedback && (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="description">
              {isFeedback ? "Konten Masukan" : "Deskripsi"}
            </Label>
            <Textarea
              id="description"
              placeholder={isFeedback ? "Bagikan masukan, saran, atau kritik Anda di sini..." : "Jelaskan detail masalah atau keluhan Anda..."}
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
