import { MessageSquare, X, ChevronLeft } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

import { ReportChatbot } from "./report-chatbot"

interface FloatingChatBubbleProps {
  currentUserId: number
}

interface ChatView {
  type: "initial" | "chatbot" | "center"
}

export function FloatingChatBubble({ currentUserId }: FloatingChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ChatView>({ type: "initial" })
  const [unreadCount, setUnreadCount] = useState(0)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkUnreadCount()
    const interval = setInterval(checkUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount !== 0) {
      toast({
        title: "🔔 Pesan Baru!",
        description: `Anda memiliki ${unreadCount} pesan baru dari tim support`,
        duration: 5000,
      })
    }
    setPrevUnreadCount(unreadCount)
  }, [unreadCount, prevUnreadCount, toast])

  const checkUnreadCount = async () => {
    try {
      const response = await fetch("/api/bug-tickets/unread-count", {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setUnreadCount(data.total_unread)
        }
      }
    } catch (error) {
      console.error("Error checking unread:", error)
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/bug-tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    setCurrentView({ type: "initial" })
    if (tickets.length === 0) {
      fetchTickets()
    }
  }

  const handleStartChatbot = () => {
    setCurrentView({ type: "chatbot" })
  }

  const handleGoToCenter = () => {
    setCurrentView({ type: "center" })
    fetchTickets()
  }

  const handleContactUsFromChatbot = () => {
    window.location.href = "/laporan-bug"
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleOpen}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
            title="Buka Chat Support"
          >
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              {currentView.type !== "initial" && (
                <button
                  onClick={() => setCurrentView({ type: "initial" })}
                  className="p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <MessageSquare className="w-5 h-5" />
              <div>
                <h3 className="font-bold">
                  {currentView.type === "chatbot"
                    ? "Laporan Masalah"
                    : currentView.type === "center"
                      ? "Pusat Laporan"
                      : "Chat Support"}
                </h3>
                <p className="text-xs opacity-90">Tim support kami siap membantu</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-800">
            {currentView.type === "initial" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin">
                      <MessageSquare className="w-6 h-6 opacity-50" />
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Belum ada laporan masalah
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klik tombol di bawah untuk membuat laporan
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const unreadMessages = ticket.messages?.filter(
                      (msg: any) => !msg.is_read && msg.user_id !== currentUserId
                    ).length ?? 0

                    return (
                      <div
                        key={ticket.id}
                        className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition"
                        onClick={() => {
                          window.location.href = `/laporan-bug#ticket-${ticket.id}`
                          setIsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {ticket.ticket_number || `#${ticket.id}`} - {ticket.title}
                            </p>
                          </div>
                          {unreadMessages > 0 && (
                            <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                              {unreadMessages}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.messages?.length ?? 0} pesan •{" "}
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    )
                  })
                )}
              </>
            )}

            {currentView.type === "chatbot" && (
              <ReportChatbot onContactUs={handleContactUsFromChatbot} />
            )}

            {currentView.type === "center" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin">
                      <MessageSquare className="w-6 h-6 opacity-50" />
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Belum ada laporan masalah
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Klik tombol "Buat Laporan" untuk membuat laporan baru
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => {
                    const unreadMessages = ticket.messages?.filter(
                      (msg: any) => !msg.is_read && msg.user_id !== currentUserId
                    ).length ?? 0

                    return (
                      <div
                        key={ticket.id}
                        className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition"
                        onClick={() => {
                          window.location.href = `/laporan-bug#ticket-${ticket.id}`
                          setIsOpen(false)
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {ticket.ticket_number || `#${ticket.id}`} - {ticket.title}
                            </p>
                          </div>
                          {unreadMessages > 0 && (
                            <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                              {unreadMessages}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.messages?.length ?? 0} pesan •{" "}
                          {new Date(ticket.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {currentView.type === "initial" && (
            <div className="border-t p-4 bg-white dark:bg-slate-900 rounded-b-2xl flex gap-2">
              <button
                onClick={handleStartChatbot}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <MessageSquare className="w-4 h-4" />
                Chat Bot
              </button>
              <button
                onClick={handleGoToCenter}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Pusat Laporan
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
