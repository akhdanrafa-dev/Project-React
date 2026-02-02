import { useState } from "react"
import { usePage } from "@inertiajs/react"

export default function TestBugApiPage() {
  const page = usePage()
  const { auth } = page.props as any
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCreateTicket = async () => {
    setLoading(true)
    setResponse(null)
    setError(null)

    try {
      const payload = {
        title: "Test Laporan",
        description: "Ini adalah laporan test",
        category: "bug",
        priority: "medium",
      }

      console.log("📤 Sending request to POST /api/bug-tickets")
      console.log("Payload:", payload)
      console.log("Auth ID:", auth.user.id)

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

      const res = await fetch("/api/bug-tickets", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      console.log("Response Status:", res.status)
      const data = await res.json()
      console.log("Response Data:", data)

      setResponse({ status: res.status, data })

      if (!res.ok) {
        setError({
          status: res.status,
          message: data.message || "Request failed",
          data,
        })
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError({
        message: err.message,
        stack: err.stack,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Bug API</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Auth Info:</h2>
          <pre className="text-sm bg-white p-2 rounded">
            {JSON.stringify(
              {
                id: auth.user.id,
                name: auth.user.name,
                email: auth.user.email,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Endpoint:</h2>
          <pre className="text-sm bg-white p-2 rounded">POST /api/bug-tickets</pre>
        </div>
      </div>

      <button
        onClick={testCreateTicket}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-bold mb-6"
      >
        {loading ? "Testing..." : "🚀 Test Create Ticket"}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <h2 className="font-bold text-red-600 mb-2">❌ Error:</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      {response && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h2 className="font-bold text-green-600 mb-2">✅ Success Response:</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold mb-2">📋 Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click the test button above</li>
          <li>Check the error or success response below</li>
          <li>Open browser DevTools (F12) Console tab for detailed logs</li>
          <li>Check Network tab to see the request/response headers</li>
        </ol>
      </div>
    </div>
  )
}
