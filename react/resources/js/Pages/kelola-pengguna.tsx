import { Head } from '@inertiajs/react';
import { Plus, Search, Edit2, Trash2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar-trigger"
import { useToast } from "@/components/ui/use-toast"
import DeveloperLayout from '@/layouts/app/DeveloperLayout'

interface User {
  id: number
  username: string
  email: string
  role: string
  password?: string
}

interface Props {
  users: User[]
}

export default function KelolaPengguna({ users: initialUsers = [] }: Props) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    email: "",
    role: "",
    password: "",
  })

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  useEffect(() => {
    const resetSearch = () => {
      setSearchTerm("")
      if (searchInputRef.current) {
        searchInputRef.current.value = ""
      }
    }

    resetSearch()
    const timeoutId = window.setTimeout(resetSearch, 100)
    window.addEventListener('pageshow', resetSearch)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('pageshow', resetSearch)
    }
  }, [])

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )



  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  }

  const getFirstErrorMessage = (errors: Record<string, string[]> | undefined) => {
    if (!errors) return null
    const firstKey = Object.keys(errors)[0]
    if (!firstKey) return null
    const firstError = errors[firstKey]?.[0]
    return firstError || null
  }

  const handleCreate = async () => {
    setCreateError(null)

    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      setCreateError('Semua field wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const csrfToken = getCsrfToken()

      const response = await fetch('/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        setCreateError('Respons server tidak valid. Silakan coba lagi.')
        return
      }

      const payload = await response.json()

      if (!response.ok) {
        const validationError = getFirstErrorMessage(payload?.errors as Record<string, string[]> | undefined)
        setCreateError(validationError || payload?.message || 'Gagal menambah pengguna.')
        return
      }

      const createdUser = payload?.user
      if (createdUser) {
        setUsers((prev) => [
          ...prev,
          {
            id: createdUser.id,
            username: createdUser.name ?? createdUser.username ?? formData.username ?? '',
            email: createdUser.email ?? formData.email ?? '',
            role: createdUser.role ?? formData.role ?? 'user',
          },
        ])
      } else {
        setCreateError('Data pengguna baru tidak ditemukan pada respons server.')
        return
      }

      setIsCreateDialogOpen(false)
      setFormData({
        username: "",
        email: "",
        role: "",
        password: "",
      })
    } catch (error) {
      console.error('Error creating user:', error)
      setCreateError('Terjadi kesalahan saat menambah pengguna.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const csrfToken = getCsrfToken()

      const response = await fetch(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          name: formData.username,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      })

      if (response.ok) {
        // Refresh the page to get updated data
        window.location.reload()
      } else {
        console.error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      setFormData({
        username: "",
        email: "",
        role: "",
        password: "",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    const targetUserId = selectedUser.id

    setLoading(true)
    try {
      const csrfToken = getCsrfToken()

      const response = await fetch(`/users/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
      })

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== targetUserId))
        toast({
          title: 'Sukses',
          description: 'Akun berhasil dihapus',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menghapus akun',
          variant: 'destructive',
        })
        console.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus akun',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({ ...user, password: "" })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  return (
    <DeveloperLayout>
      <Head title="Kelola Pengguna" />

      <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer-dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="/developer/api">Kelola Pengguna</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) {
                setCreateError(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk menambah pengguna baru
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Masukkan username"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role || ""}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="admin_it">Admin IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setCreateError(null)
                  }}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                name="user-search"
                autoComplete="off"
                placeholder="Cari username atau email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  if (document.activeElement !== e.currentTarget) {
                    e.currentTarget.value = searchTerm
                    return
                  }

                  setSearchTerm(e.target.value)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>Total {filteredUsers.length} pengguna</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">ID</th>
                    <th className="text-left py-3 px-2">Username</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Role</th>
                    <th className="text-left py-3 px-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{index + 1}</td>
                      <td className="py-3 px-2 font-medium">{user.username}</td>
                      <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah informasi pengguna
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password Baru</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role || ""}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="admin_it">Admin IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak dapat dibatalkan. Data pengguna {selectedUser?.username} akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DeveloperLayout>
  )
}
