import { Head, usePage } from '@inertiajs/react'
import {
  BarChart3,
  Package,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AppLayout from '@/layouts/app-layout'
import type { SharedData } from '@/types'



interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: string
}

interface ChatMessage {
  id: number
  sender: 'staff' | 'developer'
  message: string
  time: string
  developer_name?: string
}

export default function StaffDashboard() {
  const { auth } = usePage<SharedData>().props
  const userName = auth.user?.name || 'Staff'
  const userInitials = userName
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()

  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState<
    { name: string; total: number; value: number }[]
  >([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsRes = await fetch('/api/products', {
          credentials: 'same-origin',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        })

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          const productsArray = Array.isArray(productsData)
            ? productsData
            : productsData.data || []
          setProducts(productsArray)

          // Calculate category statistics
          const categoryMap: {
            [key: string]: { total: number; value: number }
          } = {}
          productsArray.forEach(
            (product: { category: string; stock: number; price: number }) => {
              if (!categoryMap[product.category]) {
                categoryMap[product.category] = { total: 0, value: 0 }
              }
              categoryMap[product.category].total += 1
              categoryMap[product.category].value += product.stock
            }
          )

          const stats = Object.entries(categoryMap).map(([name, data]) => ({
            name,
            total: data.total,
            value: data.value,
          }))
          setCategoryStats(stats)
        }

        // Fetch recent messages
        const messagesRes = await fetch(
          '/api/staff-developer-chats/recent-messages',
          {
            credentials: 'same-origin',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        )

        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          const messageArray = Array.isArray(messagesData)
            ? messagesData
            : messagesData.messages || []
          setMessages(
            messageArray.slice(0, 5).map((msg: ChatMessage) => ({
              ...msg,
              time: msg.time
                ? new Date(msg.time).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A',
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockProducts = products.filter((p) => p.stock < 10).length
  const activeProducts = products.filter((p) => p.status === 'Active').length

  return (
    <AppLayout>
      <Head title="Staff Dashboard" />

      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Selamat datang, {userName}! 👋</h1>
              <p className="mt-2 text-blue-100">
                Kelola produk dan komunikasi dengan developer dengan mudah
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl font-bold">{userInitials}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Produk */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Produk
              </CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {activeProducts} produk aktif
              </p>
            </CardContent>
          </Card>

          {/* Total Stok */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Stok
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock}</div>
              <p className="text-xs text-muted-foreground">
                Unit tersedia
              </p>
            </CardContent>
          </Card>

          {/* Stok Rendah */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Stok Rendah
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockProducts}</div>
              <p className="text-xs text-muted-foreground">
                Perlu restok
              </p>
            </CardContent>
          </Card>

          {/* Pesan Masuk */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pesan Masuk
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
              <p className="text-xs text-muted-foreground">
                Pesan terbaru
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Product Statistics Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Statistik Produk</CardTitle>
              <CardDescription>
                Distribusi produk per kategori
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Memuat data...
                </div>
              ) : categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="total"
                      fill="#3b82f6"
                      name="Jumlah Produk"
                    />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      name="Total Stok"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Tidak ada data produk
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Pesan Terbaru
              </CardTitle>
              <CardDescription>
                {messages.length > 0
                  ? 'Pesan dari developer'
                  : 'Tidak ada pesan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-sm text-muted-foreground">
                  Memuat...
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border-b pb-3 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {msg.sender === 'developer'
                              ? msg.developer_name || 'Developer'
                              : 'Anda'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {msg.time}
                          </p>
                        </div>
                        {msg.sender === 'developer' && (
                          <Badge variant="outline" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1 text-foreground line-clamp-2">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada pesan saat ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance & Activity Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Kategori Produk */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Kategori Produk
              </CardTitle>
              <CardDescription>
                {categoryStats.length} kategori aktif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryStats.length > 0 ? (
                  categoryStats.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.total} produk
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {cat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">stok</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada kategori
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Action & Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Ringkasan Performa
              </CardTitle>
              <CardDescription>
                Metrik kinerja harian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Tugas Selesai
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    92%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: '92%' }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      Waktu Respons Avg
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    1.8 jam
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">
                      Akurasi Data
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    98%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: '98%' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Helpful Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Tips Produktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Pantau stok produk secara berkala untuk menghindari kehabisan
                  stok
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Komunikasi aktif dengan developer untuk resolusi masalah yang
                  lebih cepat
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Update data produk secara real-time untuk akurasi maksimal
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}