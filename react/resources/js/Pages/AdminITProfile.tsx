import { Head, usePage } from '@inertiajs/react';
import { Pencil, QrCode, User } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminITLayout from '@/layouts/app/AdminITLayout';
import type { SharedData } from '@/types';

interface AdminProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    bio?: string | null;
    date_of_birth?: string | null;
    age?: number | null;
    address?: string | null;
    created_at: string;
}

interface Props {
    admin?: AdminProfile;
}

const getCsrfToken = () => {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
};

const updateCsrfToken = (newToken: string) => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag && newToken) {
        metaTag.setAttribute('content', newToken);
    }
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || '';
    }
    return '';
};

const getXsrfTokenFromCookie = () => {
    const raw = getCookie('XSRF-TOKEN');
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
};

const syncCsrfTokenFromResponse = (response: Response) => {
    const nextToken =
        response.headers.get('X-CSRF-Token') ||
        response.headers.get('x-csrf-token');
    if (nextToken) {
        updateCsrfToken(nextToken);
    }
};

const ensureCsrfCookie = async () => {
    await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
    });

    const latestXsrfToken = getXsrfTokenFromCookie();
    if (latestXsrfToken) {
        updateCsrfToken(latestXsrfToken);
    }
};

const buildCsrfHeaders = (headers?: HeadersInit) => {
    const merged = new Headers(headers || {});
    const csrfToken = getCsrfToken();
    const xsrfToken = getXsrfTokenFromCookie();

    if (xsrfToken) {
        merged.set('X-XSRF-TOKEN', xsrfToken);
        merged.delete('X-CSRF-TOKEN');
    } else if (csrfToken) {
        merged.set('X-CSRF-TOKEN', csrfToken);
    }
    if (!merged.has('X-Requested-With')) {
        merged.set('X-Requested-With', 'XMLHttpRequest');
    }

    return merged;
};

const fetchWithCsrfRetry = async (
    url: string,
    init: RequestInit,
    allowRetry = true,
) => {
    let response = await fetch(url, {
        ...init,
        credentials: init.credentials || 'same-origin',
        headers: buildCsrfHeaders(init.headers),
    });
    syncCsrfTokenFromResponse(response);

    if (response.status === 419 && allowRetry) {
        try {
            await ensureCsrfCookie();
        } catch {
            // Keep retry path even when refresh fails.
        }

        response = await fetch(url, {
            ...init,
            credentials: init.credentials || 'same-origin',
            headers: buildCsrfHeaders(init.headers),
        });
        syncCsrfTokenFromResponse(response);
    }

    return response;
};

const getTodayIsoDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calculateAgeFromBirthDate = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;

    const [year, month, day] = dateOfBirth.split('-').map(Number);
    if (!year || !month || !day) return null;

    const birthDate = new Date(year, month - 1, day);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age -= 1;
    }

    return age >= 0 ? age : null;
};

export default function AdminITProfile({ admin }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { toast } = useToast();
    const [profile, setProfile] = useState<AdminProfile | null>(admin ?? null);
    const [isEditing, setIsEditing] = useState(false);
    const [bioInput, setBioInput] = useState(admin?.bio ?? '');
    const [addressInput, setAddressInput] = useState(admin?.address ?? '');
    const [dateOfBirthInput, setDateOfBirthInput] = useState(
        admin?.date_of_birth ?? '',
    );
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        setProfile(admin ?? null);
        setBioInput(admin?.bio ?? '');
        setAddressInput(admin?.address ?? '');
        setDateOfBirthInput(admin?.date_of_birth ?? '');
        setIsEditing(false);
        setFormError(null);
    }, [admin]);

    if (!profile) {
        return (
            <AdminITLayout>
                <div className="p-6 text-red-500">
                    Admin tidak ditemukan atau data belum dimuat.
                </div>
            </AdminITLayout>
        );
    }

    const isOwnProfile = Number(auth.user?.id) === Number(profile.id);
    const profileUrl = 'https://linktr.ee/akhdanrafaa';
    const displayedAge =
        profile.age ?? calculateAgeFromBirthDate(profile.date_of_birth);
    const previewAge = calculateAgeFromBirthDate(dateOfBirthInput);

    const handleStartEditing = () => {
        setBioInput(profile.bio ?? '');
        setAddressInput(profile.address ?? '');
        setDateOfBirthInput(profile.date_of_birth ?? '');
        setFormError(null);
        setIsEditing(true);
    };

    const handleCancelEditing = () => {
        setBioInput(profile.bio ?? '');
        setAddressInput(profile.address ?? '');
        setDateOfBirthInput(profile.date_of_birth ?? '');
        setFormError(null);
        setIsEditing(false);
    };

    const handleSaveProfile = async () => {
        if (!isOwnProfile || saving) return;

        setSaving(true);
        setFormError(null);

        try {
            const response = await fetchWithCsrfRetry(
                `/api/admin-it/profile/${profile.id}`,
                {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    bio: bioInput,
                    date_of_birth: dateOfBirthInput || null,
                    address: addressInput,
                }),
                },
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(
                    data?.message || 'Gagal memperbarui profil Admin IT.',
                );
            }

            if (data?.admin) {
                setProfile(data.admin as AdminProfile);
                setBioInput(data.admin.bio ?? '');
                setAddressInput(data.admin.address ?? '');
                setDateOfBirthInput(data.admin.date_of_birth ?? '');
            }

            setIsEditing(false);
            toast({
                title: 'Profil diperbarui',
                description: data?.message || 'Bio dan umur berhasil diperbarui.',
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Gagal memperbarui profil.';

            setFormError(message);
            toast({
                variant: 'destructive',
                title: 'Gagal menyimpan',
                description: message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminITLayout>
            <Head title={`Profile: ${profile.name}`} />

            <div className="space-y-6 p-6">
                <h1 className="text-3xl font-bold">Admin IT Profile</h1>
                <p className="text-muted-foreground">
                    Informasi detail akun dan profil admin.
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" /> Profile
                                        Information
                                    </CardTitle>
                                    <CardDescription>
                                        Detail akun dan informasi pribadi.
                                    </CardDescription>
                                </div>
                                {isOwnProfile && !isEditing && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleStartEditing}
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit Profil
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">Username</p>
                                <p>{profile.name}</p>
                            </div>
                            <div>
                                <p className="font-medium">Email</p>
                                <p>{profile.email}</p>
                            </div>
                            <div>
                                <p className="font-medium">Bio</p>
                                <p className="whitespace-pre-wrap">
                                    {profile.bio || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium">Tanggal Lahir</p>
                                <p>{profile.date_of_birth || '-'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Umur</p>
                                <p>{displayedAge ?? '-'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Address</p>
                                <p>{profile.address || '-'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Role</p>
                                <Badge variant="secondary">{profile.role}</Badge>
                            </div>
                            <div>
                                <p className="font-medium">Member Since</p>
                                <p>{profile.created_at}</p>
                            </div>

                            {isOwnProfile && isEditing && (
                                <div className="space-y-4 rounded-md border p-4">
                                    <p className="font-medium">
                                        Edit Bio, Alamat, dan Tanggal Lahir
                                    </p>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-bio">Bio</Label>
                                        <Textarea
                                            id="profile-bio"
                                            value={bioInput}
                                            onChange={(event) =>
                                                setBioInput(event.target.value)
                                            }
                                            placeholder="Tulis bio singkat..."
                                            rows={4}
                                            maxLength={1000}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-address">
                                            Alamat
                                        </Label>
                                        <Textarea
                                            id="profile-address"
                                            value={addressInput}
                                            onChange={(event) =>
                                                setAddressInput(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Masukkan alamat..."
                                            rows={3}
                                            maxLength={255}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-date-of-birth">
                                            Tanggal Lahir
                                        </Label>
                                        <Input
                                            id="profile-date-of-birth"
                                            type="date"
                                            value={dateOfBirthInput}
                                            onChange={(event) =>
                                                setDateOfBirthInput(
                                                    event.target.value,
                                                )
                                            }
                                            max={getTodayIsoDate()}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Umur otomatis: {previewAge ?? '-'}
                                        </p>
                                    </div>

                                    {formError && (
                                        <p className="text-sm text-red-600">
                                            {formError}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                        >
                                            {saving
                                                ? 'Menyimpan...'
                                                : 'Simpan'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelEditing}
                                            disabled={saving}
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
