import { Head } from '@inertiajs/react';
import { Plus, Search, Edit2, Trash2, Eye } from "lucide-react"
import { useState } from "react"

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
import DeveloperLayout from '@/layouts/app/DeveloperLayout'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface Props {
  users: User[]
}

export default function KelolaPengguna({ users: initialUsers = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>(initialUsers)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    email: "",
    role: "",
  })

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )



  const handleCreate = () => {
    const newUser: User = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      username: formData.username || "",
      email: formData.email || "",
      role: formData.role || "",
    }
    setUsers([...users, newUser])
    setIsCreateDialogOpen(false)
    setFormData({
      username: "",
      email: "",
      role: "",
    })
  }

  const handleEdit = () => {
    if (!selectedUser) return
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...selectedUser, ...formData }
        : u
    ))
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    setFormData({
      username: "",
      email: "",
      role: "",
    })
  }

  const handleDelete = () => {
    if (!selectedUser) return
    setUsers(users.filter(u => u.id !== selectedUser.id))
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData(user)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  return (
    <DeveloperLayout>
      <Head title="Kelola Pengguna" />
      
      <div className="flex flex-1 flex-col gap-6 p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kelola Pengguna</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola akun pengguna dan tiket support</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreate}>Simpan</Button>
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
                placeholder="Cari username atau email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{user.id}</td>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit}>Simpan Perubahan</Button>
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
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DeveloperLayout>
  )
}
