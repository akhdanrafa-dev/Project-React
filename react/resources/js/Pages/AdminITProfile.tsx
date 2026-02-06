import { Head } from '@inertiajs/react';
import { User, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react'; // ✅ BENAR

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import AdminITLayout from '@/layouts/app/AdminITLayout';

interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  age?: number;
  address?: string;
  created_at: string;
}

interface Props {
  admin?: AdminProfile;
}

export default function AdminITProfile({ admin }: Props) {
  if (!admin) {
    return (
      <AdminITLayout>
        <div className="p-6 text-red-500">
          Admin tidak ditemukan atau data belum dimuat.
        </div>
      </AdminITLayout>
    );
  }

  const profileUrl = `${window.location.origin}/admin-it/profile/${admin.id}`;

  return (
    <AdminITLayout>
      <Head title={`Profile: ${admin.name}`} />

      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Admin IT Profile</h1>
        <p className="text-muted-foreground">
          Informasi detail akun dan profil admin.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Profile Information
              </CardTitle>
              <CardDescription>
                Detail akun dan informasi pribadi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Username</p>
                <p>{admin.name}</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p>{admin.email}</p>
              </div>
              <div>
                <p className="font-medium">Bio</p>
                <p>{admin.bio || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Age</p>
                <p>{admin.age || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Address</p>
                <p>{admin.address || '-'}</p>
              </div>
              <div>
                <p className="font-medium">Role</p>
                <Badge variant="secondary">{admin.role}</Badge>
              </div>
              <div>
                <p className="font-medium">Member Since</p>
                <p>{admin.created_at}</p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" /> Profile QR Code
              </CardTitle>
              <CardDescription>
                Scan QR ini untuk membuka halaman profil.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRCodeCanvas value={profileUrl} size={200} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminITLayout>
  );
}
