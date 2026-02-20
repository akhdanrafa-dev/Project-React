import { toast } from "@/components/ui/use-toast"

type ApiErrorPayload = {
  message?: unknown
  errors?: Record<string, unknown>
}

const SESSION_ERROR_STATUSES = new Set([401, 419, 440])
const SESSION_ERROR_KEYWORDS = [
  "csrf token mismatch",
  "token mismatch",
  "invalid csrf",
  "page expired",
  "session expired",
  "unauthenticated",
]
const TOAST_COOLDOWN_MS = 5000

let isInstalled = false
let lastToastAt = 0

function withinCooldown() {
  return Date.now() - lastToastAt < TOAST_COOLDOWN_MS
}

function showRefreshToast(description?: string) {
  if (withinCooldown()) return

  lastToastAt = Date.now()
  toast({
    title: "Permintaan gagal",
    description:
      description ??
      "Terjadi masalah sesi atau token. Harap me-refresh halaman browser Anda lalu coba lagi.",
    variant: "destructive",
    duration: 5000,
  })
}

function normalizeErrorText(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase()
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .join(" ")
      .toLowerCase()
  }
  return ""
}

function containsSessionKeyword(text: string) {
  if (!text) return false
  return SESSION_ERROR_KEYWORDS.some((keyword) => text.includes(keyword))
}

async function readErrorText(response: Response): Promise<string> {
  try {
    const clonedResponse = response.clone()
    const contentType = (
      clonedResponse.headers.get("content-type") ?? ""
    ).toLowerCase()

    if (contentType.includes("application/json")) {
      const payload = (await clonedResponse.json()) as ApiErrorPayload
      const messageText = normalizeErrorText(payload?.message)
      const validationText = normalizeErrorText(
        payload?.errors ? Object.values(payload.errors).flat() : []
      )
      return `${messageText} ${validationText}`.trim()
    }

    const rawText = await clonedResponse.text()
    return rawText.toLowerCase()
  } catch {
    return ""
  }
}

async function notifyForFailedResponse(response: Response) {
  if (response.ok) return

  const statusIndicatesSessionIssue = SESSION_ERROR_STATUSES.has(response.status)
  const errorText = await readErrorText(response)
  const textIndicatesSessionIssue = containsSessionKeyword(errorText)

  if (statusIndicatesSessionIssue || textIndicatesSessionIssue) {
    showRefreshToast()
  }
}

function notifyForFetchException(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  const isNetworkError =
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")

  if (!isNetworkError) return

  showRefreshToast(
    "Terjadi gangguan koneksi saat mengirim data. Harap me-refresh halaman browser Anda lalu coba lagi."
  )
}

export function installGlobalFetchErrorNotifier() {
  if (isInstalled || typeof window === "undefined" || typeof window.fetch !== "function") {
    return
  }

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const response = await originalFetch(...args)
      await notifyForFailedResponse(response)
      return response
    } catch (error) {
      notifyForFetchException(error)
      throw error
    }
  }

  isInstalled = true
}

