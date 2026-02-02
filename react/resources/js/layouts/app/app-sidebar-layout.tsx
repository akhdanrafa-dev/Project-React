import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar as DeveloperSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AppSidebar as UserSidebar } from '@/layouts/app/component/AppSidebar';
import { StaffSidebar } from '@/layouts/app/component/StaffSidebar';
import { type BreadcrumbItem, type SharedData } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user?.role;
    
    // Gunakan UserSidebar untuk role 'user', StaffSidebar untuk 'staff', DeveloperSidebar untuk yang lain
    const Sidebar = userRole === 'user' ? UserSidebar : userRole === 'staff' ? StaffSidebar : DeveloperSidebar;

    return (
        <AppShell variant="sidebar">
            <Sidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
