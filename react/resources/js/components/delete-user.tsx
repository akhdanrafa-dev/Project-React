import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SharedData } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface DeleteUserProps {
    user?: User;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function DeleteUser({
    user,
    open: controlledOpen,
    onOpenChange,
}: DeleteUserProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const { auth } = usePage<SharedData>().props;
    
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled 
        ? (value: boolean) => onOpenChange?.(value)
        : setInternalOpen;

    // Untuk penggunaan di profile
    const currentUser = user || auth?.user;

    const handleDelete = () => {
        if (currentUser?.id) {
            router.delete(`/settings/profile`, {
                data: { password },
                onSuccess: () => {
                    setOpen(false);
                    setPassword('');
                },
            });
        }
    };

    // Jika digunakan tanpa parameter user, render sebagai section di profile
    if (!user) {
        return (
            <div className="space-y-6">
                <Separator className="my-8" />
                <HeadingSmall
                    title="Delete Account"
                    description="Delete your account and all associated data. This action is permanent and cannot be undone."
                />
                <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="lg">
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Please confirm your password to delete your account permanently.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </Card>
            </div>
        );
    }

    // Untuk penggunaan di users list dengan parameter
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus pengguna "{currentUser?.name}"? 
                        Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
