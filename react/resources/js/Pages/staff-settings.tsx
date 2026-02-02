import { Head } from '@inertiajs/react';
import { User, Bell, Lock, Eye, EyeOff, Save } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: dashboard().url,
    },
];

export default function StaffSettings() {
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyReport: true,
  })

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Settings" />
      
      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola preferensi dan pengaturan akun Anda</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Pengaturan Profil</CardTitle>
                <CardDescription>Update informasi profil Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" placeholder="Nama Lengkap" defaultValue="Ahmad Wijaya" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" defaultValue="ahmad.wijaya@company.com" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input id="phone" placeholder="+62 xxx xxxx xxxx" defaultValue="+62 812 3456 7890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                <Select defaultValue="penjualan">
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penjualan">Penjualan</SelectItem>
                    <SelectItem value="inventori">Inventori</SelectItem>
                    <SelectItem value="customer-service">Customer Service</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operation">Operation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Alamat lengkap" defaultValue="Jl. Sudirman No. 123, Jakarta Pusat" />
            </div>

            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Simpan Profil
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Keamanan</CardTitle>
                <CardDescription>Kelola password dan keamanan akun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password saat ini"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Masukkan password baru"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input id="confirm-password" type="password" placeholder="Konfirmasi password baru" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Tips Keamanan:</strong> Gunakan password yang kuat dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.
              </p>
            </div>

            <Button className="gap-2">
              <Lock className="h-4 w-4" />
              Ubah Password
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Notifikasi</CardTitle>
                <CardDescription>Kelola preferensi notifikasi Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Terima notifikasi melalui email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Terima notifikasi push di browser</p>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">SMS Alerts</p>
                <p className="text-xs text-muted-foreground">Terima peringatan penting melalui SMS</p>
              </div>
              <Switch
                checked={notificationSettings.smsAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, smsAlerts: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Weekly Report</p>
                <p className="text-xs text-muted-foreground">Terima laporan mingguan setiap hari Jumat</p>
              </div>
              <Switch
                checked={notificationSettings.weeklyReport}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                }
              />
            </div>

            <Button className="gap-2 mt-4">
              <Save className="h-4 w-4" />
              Simpan Preferensi Notifikasi
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle>Manajemen Sesi</CardTitle>
            <CardDescription>Kelola sesi aktif Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Sesi Saat Ini</p>
                <p className="text-xs text-muted-foreground">Chrome • Windows • Jakarta, ID</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aktif</span>
            </div>

            <Button variant="outline" className="w-full">
              Logout dari Semua Perangkat
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
