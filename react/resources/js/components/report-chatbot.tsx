import { Send, CheckCircle2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  options?: string[]
  source?: "ai" | "fallback" | "static"
}

interface Question {
  id: string
  text: string
  type: "multiple-choice" | "open-text"
  options?: string[]
}

interface ChatbotProps {
  onContactUs: () => void
}

interface RealtimeAIReplyResult {
  reply: string | null
  isAI: boolean
}

type IssueGroup = "bug" | "navigation" | "obstacle" | "suggestion" | "other"

interface KeywordRule {
  keywords: string[]
  response: string
}

const GLOBAL_KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ["membuat laporan", "buat laporan", "bikin laporan", "buat tiket", "membuat tiket", "lapor bug"],
    response:
      "Untuk membuat laporan pertama kali, pilih opsi Bug lalu jawab pertanyaan selanjutnya sampai selesai. Setelah itu akan muncul tombol navigasi ke pusat laporan. Jika sudah pernah membuat tiket, Anda bisa langsung klik tiket pada halaman awal.",
  },
  {
    keywords: ["layanan lainnya", "layanan kami lainnya", "layanan lain", "service lain"],
    response:
      "Anda bisa melihat di sidebar bagian Layanan. Klik tombol Layanan Kami Lainnya, lalu pilih link layanan yang ingin Anda kunjungi.",
  },
]

const KEYWORD_REPLY_RULES: Record<IssueGroup, KeywordRule[]> = {
  bug: [
    {
      keywords: ["login", "signin", "masuk", "password", "otp", "akun"],
      response:
        "Masalah ini terlihat terkait autentikasi akun. Coba logout-login ulang, pastikan email/password benar, lalu reset password jika masih gagal.",
    },
    {
      keywords: ["blank", "putih", "loading", "spinner", "freeze", "hang"],
      response:
        "Halaman terindikasi macet saat render. Coba refresh paksa (Ctrl + F5), hapus cache browser, lalu ulangi langkah yang sama.",
    },
    {
      keywords: ["error", "500", "crash", "exception"],
      response:
        "Terjadi indikasi error sistem. Mohon sertakan waktu kejadian dan langkah terakhir sebelum error supaya tim bisa trace log lebih cepat.",
    },
  ],
  navigation: [
    {
      keywords: ["riwayat", "pembelian", "belanja", "order", "pesanan", "transaksi"],
      response:
        "Untuk melihat riwayat pembelian, buka sidebar lalu pilih menu Riwayat Pembelian. Anda juga bisa akses langsung ke /history-pembelian.",
    },
    {
      keywords: ["menu", "sidebar", "navigasi", "button", "tombol", "link"],
      response:
        "Masalah ini terkait navigasi UI. Coba cek lagi menu di sidebar sesuai role akun Anda, lalu klik ulang dari halaman utama.",
    },
    {
      keywords: ["404", "not found", "halaman tidak ditemukan"],
      response:
        "Link yang dibuka kemungkinan tidak valid atau akses role belum sesuai. Buka ulang dari menu resmi di sidebar untuk menghindari URL yang salah.",
    },
  ],
  obstacle: [
    {
      keywords: ["lambat", "lemot", "slow", "lag", "berat"],
      response:
        "Terindikasi kendala performa. Coba tutup tab lain, gunakan jaringan stabil, lalu ulangi proses secara bertahap.",
    },
    {
      keywords: ["upload", "unggah", "file", "gambar", "lampiran"],
      response:
        "Jika kendalanya saat upload, pastikan ukuran file tidak terlalu besar dan format file didukung sebelum dikirim ulang.",
    },
  ],
  suggestion: [
    {
      keywords: ["fitur", "feature", "tambah", "tambahkan", "request"],
      response:
        "Terima kasih atas sarannya. Masukan fitur baru akan kami catat untuk evaluasi roadmap pengembangan berikutnya.",
    },
    {
      keywords: ["ui", "ux", "tampilan", "desain", "layout"],
      response:
        "Saran terkait tampilan sudah diterima. Kami akan review aspek UI/UX agar alur penggunaan lebih jelas dan nyaman.",
    },
  ],
  other: [
    {
      keywords: ["laporan", "tiket", "bug"],
      response:
        "Untuk penanganan lebih lanjut, Anda bisa lanjutkan ke pusat laporan agar masalah tercatat sebagai tiket resmi.",
    },
  ],
}

const DEFAULT_GROUP_REPLY: Partial<Record<IssueGroup, string>> = {
  bug:
    "Masalah ini terindikasi bug teknis. Coba refresh dan ulangi langkahnya sekali lagi. Jika masih sama, lanjutkan pengajuan laporan agar tim bisa menindaklanjuti.",
  navigation:
    "Untuk pertanyaan navigasi, cek menu di sidebar sesuai role akun Anda. Jika yang dicari riwayat pembelian, gunakan menu Riwayat Pembelian atau buka /history-pembelian.",
  obstacle:
    "Terindikasi kendala penggunaan. Coba ulangi dengan koneksi stabil dan langkah yang lebih sederhana, lalu beri tahu pesan error yang muncul jika masih gagal.",
  suggestion:
    "Terima kasih atas sarannya. Masukan Anda sudah kami catat untuk bahan evaluasi pengembangan berikutnya.",
  other:
    "Saya sudah menerima pertanyaan Anda. Jelaskan detail konteksnya agar saya bisa memberi arahan yang lebih tepat.",
}

const getIssueGroup = (issueType: string): IssueGroup => {
  if (issueType.includes("Bug")) {
    return "bug"
  }

  if (issueType.includes("Navigasi")) {
    return "navigation"
  }

  if (issueType.includes("Kendala")) {
    return "obstacle"
  }

  if (issueType.includes("Saran")) {
    return "suggestion"
  }

  return "other"
}

const getKeywordReply = (issueType: string, contextText: string): string | null => {
  const normalizedText = contextText.toLowerCase()

  for (const rule of GLOBAL_KEYWORD_RULES) {
    const isMatched = rule.keywords.some((keyword) => normalizedText.includes(keyword))
    if (isMatched) {
      return rule.response
    }
  }

  const issueGroup = getIssueGroup(issueType)
  const groupRules = KEYWORD_REPLY_RULES[issueGroup]

  for (const rule of groupRules) {
    const isMatched = rule.keywords.some((keyword) => normalizedText.includes(keyword))
    if (isMatched) {
      return rule.response
    }
  }

  return DEFAULT_GROUP_REPLY[issueGroup] ?? null
}

const getCompletionModeForIssueType = (issueType: string): "report" | "faq" => {
  const issueGroup = getIssueGroup(issueType)
  return issueGroup === "bug" || issueGroup === "obstacle" ? "report" : "faq"
}

const OTHER_QUESTION_ANSWERS: Array<{ question: string; answer: string }> = [
  {
    question: "Dimana aku bisa membuat tiket laporan?",
    answer:
      "Untuk membuat laporan pertama kali anda bisa memilih opsi bug pada pertanyaan relevan lalu jawab pertanyaan selanjutnya, dan ketika sudah menjawab semua nanti akan ada tombol navigasi menuju pusat laporan, namun jika anda sudah membuat tiket sebelumnya tinggal klik tiket saja pada halaman awal.",
  },
  {
    question: "Dimana aku bisa mengunjungi layanan kalian yang lainnya?",
    answer:
      "Anda bisa mellihat pada sidebar bagian layanan, nah disitu ada button dengan tulisan layanan kami lainnya, anda bisa klik disitu dan pilihlah mana link yang ingin anda kunjungi.",
  },
]

const OTHER_QUESTION_OPTIONS = OTHER_QUESTION_ANSWERS.map((item) => item.question)

const OTHER_QUESTION_ANSWER_MAP: Record<string, string> = OTHER_QUESTION_ANSWERS.reduce(
  (result, item) => {
    result[item.question] = item.answer
    return result
  },
  {} as Record<string, string>,
)

const OTHER_QUESTION: Question = {
  id: "other-question",
  text: "Silakan pilih pertanyaan lainnya:",
  type: "multiple-choice",
  options: OTHER_QUESTION_OPTIONS,
}

const BASE_QUESTIONS: Question[] = [
  {
    id: "issue-type",
    text: "Jenis masalah apa yang Anda alami?",
    type: "multiple-choice",
    options: ["🐛 Bug", "🛣️ Navigasi", "⚠️ Kendala", "💡 Saran", "Lainnya"],
  },
  {
    id: "severity",
    text: "Seberapa serius masalah ini?",
    type: "multiple-choice",
    options: ["🔴 Kritis", "🟠 Tinggi", "🟡 Sedang", "🟢 Rendah"],
  },
  {
    id: "description",
    text: "Deskripsi singkat tentang masalah yang Anda hadapi:",
    type: "open-text",
  },
  {
    id: "steps",
    text: "Langkah-langkah untuk mereproduksi masalah (jika ada):",
    type: "open-text",
  },
]

const getQuestionsForIssueType = (issueType: string): Question[] => {
  if (issueType === "Lainnya") {
    return [BASE_QUESTIONS[0], OTHER_QUESTION]
  }

  const isNavigation = issueType.includes("Navigasi")
  const isSuggestion = issueType.includes("Saran")

  if (isNavigation || isSuggestion) {
    return [BASE_QUESTIONS[0], BASE_QUESTIONS[2]]
  }

  return BASE_QUESTIONS
}

export function ReportChatbot({ onContactUs }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>(BASE_QUESTIONS)
  const [completionMode, setCompletionMode] = useState<"report" | "faq">("report")
  const isProcessingRef = useRef(false)
  const messageSequenceRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const nextMessageId = (prefix: string) => {
    messageSequenceRef.current += 1
    return `${prefix}-${messageSequenceRef.current}`
  }

  const getRealtimeAIReply = async (
    issueType: string,
    description: string,
    steps: string,
  ): Promise<RealtimeAIReplyResult> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
    if (csrfToken) {
      headers["X-CSRF-TOKEN"] = csrfToken
    }

    try {
      const response = await fetch("/api/chatbot/reply", {
        method: "POST",
        headers,
        body: JSON.stringify({
          issue_type: issueType,
          description,
          steps,
        }),
      })

      if (!response.ok) {
        return { reply: null, isAI: false }
      }

      const data: { reply?: string | null; source?: string } = await response.json()
      if (typeof data.reply !== "string") {
        return { reply: null, isAI: false }
      }

      const cleanedReply = data.reply.trim()
      if (cleanedReply.length === 0) {
        return { reply: null, isAI: false }
      }

      return {
        reply: cleanedReply,
        isAI: data.source === "ai",
      }
    } catch {
      return { reply: null, isAI: false }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialMessage: Message = {
        id: "greeting",
        type: "bot",
        content: "Halo! 👋 Kami di sini untuk membantu Anda. Mari kita mulai dengan beberapa pertanyaan singkat.",
      }
      setMessages([initialMessage])

      const questionTimer = setTimeout(() => {
        const firstQuestion = BASE_QUESTIONS[0]
        const questionMessage: Message = {
          id: `q-${firstQuestion.id}`,
          type: "bot",
          content: firstQuestion.text,
          options: firstQuestion.options,
        }
        setMessages((prev) => [...prev, questionMessage])
        setLoading(false)
      }, 800)

      return () => clearTimeout(questionTimer)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleAnswer = (answer: string) => {
    if (loading || isComplete || isProcessingRef.current) {
      return
    }

    isProcessingRef.current = true
    setLoading(true)

    const currentQuestion = questions[currentQuestionIndex]
    const userMessage: Message = {
      id: nextMessageId("user"),
      type: "user",
      content: answer,
    }

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: answer,
    }
    setAnswers(updatedAnswers)

    setMessages((prev) => [...prev, userMessage])
    setTextInput("")

    setTimeout(() => {
      let questionsToUse = questions
      
      if (currentQuestionIndex === 0 && currentQuestion.id === "issue-type") {
        setCompletionMode(getCompletionModeForIssueType(answer))
        questionsToUse = getQuestionsForIssueType(answer)
        setQuestions(questionsToUse)
      }

      if (currentQuestion.id === "other-question") {
        const otherAnswer = OTHER_QUESTION_ANSWER_MAP[answer]
        if (otherAnswer) {
          const otherAnswerMessage: Message = {
            id: nextMessageId("other-answer"),
            type: "bot",
            content: otherAnswer,
            source: "static",
          }
          setMessages((prev) => [...prev, otherAnswerMessage])
          setIsComplete(true)
          setLoading(false)
          isProcessingRef.current = false
          return
        }
      }

      if (currentQuestionIndex === questionsToUse.length - 1) {
        const issueTypeAnswer = updatedAnswers["issue-type"] ?? ""
        const descriptionAnswer = updatedAnswers["description"] ?? ""
        const stepsAnswer = updatedAnswers["steps"] ?? ""
        const finishWithReply = async () => {
          const aiResult = await getRealtimeAIReply(issueTypeAnswer, descriptionAnswer, stepsAnswer)
          const fallbackReply = getKeywordReply(issueTypeAnswer, `${descriptionAnswer} ${stepsAnswer}`)
          const finalReply = aiResult.reply ?? fallbackReply

          if (finalReply) {
            const replyMessage: Message = {
              id: nextMessageId(aiResult.reply ? "ai-reply" : "keyword-reply"),
              type: "bot",
              content: finalReply,
              source: aiResult.reply && aiResult.isAI ? "ai" : "fallback",
            }
            setMessages((prev) => [...prev, replyMessage])
          }

          setIsComplete(true)
          setLoading(false)
          isProcessingRef.current = false
        }

        void finishWithReply()
      } else {
        const nextQuestion = questionsToUse[currentQuestionIndex + 1]
        const nextMessage: Message = {
          id: `q-${nextQuestion.id}`,
          type: "bot",
          content: nextQuestion.text,
          options: nextQuestion.options,
        }
        setMessages((prev) => [...prev, nextMessage])
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setLoading(false)
        isProcessingRef.current = false
      }
    }, 600)
  }

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      handleAnswer(textInput)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "bot" ? "justify-start" : "justify-end"}`}
          >
            {message.type === "bot" && (
              <div className="flex gap-2 max-w-xs">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  AI
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-lg px-3 py-2 text-sm">
                  {message.content}
                  {message.source && (
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-blue-700/80 dark:text-blue-200/80">
                      {message.source === "ai"
                        ? "Sumber: AI Realtime"
                        : message.source === "fallback"
                          ? "Sumber: Fallback Lokal"
                          : "Sumber: Jawaban Tetap"}
                    </p>
                  )}
                  {message.options && (
                    <div className="mt-2 space-y-2">
                      {message.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(option)}
                          disabled={loading || isComplete || message.id !== `q-${currentQuestion.id}`}
                          className="block w-full text-left bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-gray-100 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-1 text-xs transition"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {message.type === "user" && (
              <div className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm max-w-xs">
                {message.content}
              </div>
            )}
          </div>
        ))}

        {isComplete && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-xs">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                ✓
              </div>
              <div className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-lg px-3 py-2 text-sm space-y-2">
                {completionMode === "report" ? (
                  <>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Informasi Anda diterima
                    </p>
                    <p className="text-xs">Silakan klik tombol di bawah untuk melanjutkan pengajuan laporan.</p>
                  </>
                ) : (
                  <p className="text-xs">Semoga jawaban ini membantu. Jika perlu, Anda bisa mulai chat ulang untuk pertanyaan lain.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isComplete && !loading && currentQuestion.type === "open-text" && (
        <div className="flex gap-2">
          <Input
            placeholder="Ketik jawaban Anda..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isComplete}
            className="text-sm"
          />
          <Button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isComplete || loading}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isComplete && completionMode === "report" && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              sessionStorage.setItem("chatbot-answers", JSON.stringify(answers))
              onContactUs()
            }}
            className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
            Hubungi Kami
          </Button>
        </div>
      )}
    </div>
  )
}





