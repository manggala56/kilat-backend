import { Link } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Users, 
    Store, 
    Beaker,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import * as reports from '@/routes/owner/reports';
import * as rawMaterials from '@/routes/owner/raw-materials';
import * as recipes from '@/routes/owner/recipes';
import * as rooms from '@/routes/owner/rooms';
import * as employees from '@/routes/owner/employees';
import * as outlets from '@/routes/owner/outlets';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Laporan Penjualan',
        href: reports.index.url(),
        icon: ShoppingCart,
    },
    {
        title: 'Bahan Baku',
        href: rawMaterials.index.url(),
        icon: Package,
    },
    {
        title: 'Resep & BOM',
        href: recipes.index.url(),
        icon: Beaker,
    },
    {
        title: 'Manajemen Ruang (PS)',
        href: rooms.index.url(),
        icon: Store,
    },
    {
        title: 'Karyawan',
        href: employees.index.url(),
        icon: Users,
    },
    {
        title: 'Manajemen Outlet',
        href: outlets.index.url(),
        icon: Store,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
