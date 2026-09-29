import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Store, CheckCircle, XCircle, Lock, Search, Smartphone, LogOut, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pagination } from '@/components/Pagination';
import * as outlets from '@/routes/owner/outlets';

interface DeviceItem {
    id: number;
    device_id: string;
    device_name: string;
    device_model: string | null;
    device_os: string | null;
    status: 'active' | 'revoked';
    last_active_at: string | null;
    paired_at: string;
}

interface Tenant {
    id: number;
    business_name: string;
    store_id: string;
    business_address: string | null;
    status: 'active' | 'suspended';
    subscription_package: {
        name: string;
        max_outlets: number;
        max_devices_per_outlet?: number;
    } | null;
    devices?: DeviceItem[];
}

export default function OutletsIndex({
    tenants,
    maxOutlets,
    packages,
    canAdd,
    filters,
}: {
    tenants: any;
    maxOutlets: number;
    packages: any[];
    canAdd: boolean;
    filters?: any;
}) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [search, setSearch] = useState(filters?.search || '');

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search) {
                router.get(outlets.index.url(), { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const [formData, setFormData] = useState({
        business_name: '',
        store_id: '',
        business_address: '',
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Outlet', href: outlets.index.url() },
    ];

    const openAddModal = () => {
        setFormData({ business_name: '', store_id: '', business_address: '' });
        setIsAddModalOpen(true);
    };

    const openEditModal = (t: Tenant) => {
        setEditingTenant(t);
        setFormData({
            business_name: t.business_name,
            store_id: t.store_id,
            business_address: t.business_address ?? '',
        });
        setIsEditModalOpen(true);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(outlets.store.url(), formData as any, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                toast.success('Outlet baru berhasil ditambahkan!');
            },
            onError: (err) => {
                toast.error(err.limit || err.store_id || err.business_name || 'Terjadi kesalahan');
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        router.put(outlets.update.url(editingTenant.id), {
            business_name: formData.business_name,
            business_address: formData.business_address,
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success('Outlet berhasil diperbarui');
            },
            onError: () => toast.error('Terjadi kesalahan'),
        });
    };

    const handleSuspend = (tenant: Tenant) => {
        if (confirm(`Nonaktifkan outlet "${tenant.business_name}"? Kasir tidak bisa login ke outlet ini.`)) {
            router.delete(outlets.destroy.url(tenant.id), {
                onSuccess: () => toast.success('Outlet berhasil dinonaktifkan'),
                onError: (err) => toast.error(err.error || 'Terjadi kesalahan'),
            });
        }
    };

    const handleRevokeDevice = (device: DeviceItem) => {
        if (confirm(`Putuskan perangkat "${device.device_name}"? Sesi aplikasi POS pada perangkat ini akan langsung di-logout.`)) {
            router.delete(`/owner/devices/${device.id}/revoke`, {
                onSuccess: () => toast.success(`Perangkat "${device.device_name}" berhasil diputuskan`),
                onError: (err: any) => toast.error(err.message || 'Gagal memutuskan perangkat'),
            });
        }
    };

    const usedSlots  = tenants?.data?.length || 0;
    const totalSlots = maxOutlets;
    const percentage = Math.round((usedSlots / totalSlots) * 100);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(outlets.index.url(), { search }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Outlet & Toko" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Manajemen Outlet</h2>
                        <p className="text-muted-foreground text-sm">Daftarkan dan kelola semua cabang toko Anda.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Cari outlet..." className="pl-8 w-full md:w-[250px]" value={search} onChange={e => setSearch(e.target.value)} />
                        </form>
                        {canAdd ? (
                            <Button onClick={openAddModal} className="bg-[#FEB400] text-black hover:bg-[#e0a000] shrink-0">
                                <Plus className="mr-2 h-4 w-4" /> Tambah Outlet
                            </Button>
                        ) : (
                            <Button disabled className="shrink-0 opacity-70">
                                <Lock className="mr-2 h-4 w-4" /> Batas Outlet Tercapai
                            </Button>
                        )}
                    </div>
                </div>

                {/* Slot Usage Card */}
                <Card className="border-[#FEB400]/30 bg-gradient-to-r from-[#FEB400]/5 to-transparent">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">Kuota Outlet Terpakai</span>
                            <span className="text-sm font-bold text-[#FEB400]">{usedSlots} / {totalSlots} Outlet</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: percentage >= 100 ? '#ef4444' : '#FEB400',
                                }}
                            />
                        </div>
                        {!canAdd && (
                            <p className="text-xs text-red-500 mt-2 font-medium">
                                ⚠️ Kuota penuh. Hubungi admin atau upgrade paket langganan untuk menambah outlet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Outlet Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants?.data?.map((t: any) => (
                        <Card
                            key={t.id}
                            className={`overflow-hidden border-t-4 transition-all ${
                                t.status === 'active' ? 'border-t-[#FEB400]' : 'border-t-muted opacity-60'
                            }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-lg bg-[#FEB400]/10 flex items-center justify-center">
                                            <Store className="h-5 w-5 text-[#FEB400]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{t.business_name}</CardTitle>
                                            <CardDescription className="font-mono text-xs">#{t.store_id}</CardDescription>
                                        </div>
                                    </div>
                                    {t.status === 'active' ? (
                                        <Badge className="bg-green-500 gap-1 text-xs">
                                            <CheckCircle className="h-3 w-3" /> Aktif
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="gap-1 text-xs">
                                            <XCircle className="h-3 w-3" /> Nonaktif
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-3 min-h-[32px]">
                                    {t.business_address || <span className="italic">Alamat belum diisi</span>}
                                </p>
                                {t.subscription_package && (
                                    <div className="text-xs text-muted-foreground mb-3">
                                        📦 Paket: <span className="font-medium">{t.subscription_package.name}</span>
                                        {' '}(max {t.subscription_package.max_outlets} outlet)
                                    </div>
                                )}

                                {/* Online Order URL Banner */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mb-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-amber-500 mb-1">
                                        <span>🌐 Link Pesan Online</span>
                                        <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-500 border-amber-500/30">Guest QR Menu</Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <code className="text-[11px] font-mono bg-background/80 px-2 py-1 rounded border flex-1 truncate text-foreground">
                                            /order/{t.store_id}
                                        </code>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            title="Salin Link Pesan Online"
                                            onClick={() => {
                                                const url = `${window.location.origin}/order/${t.store_id}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('Link Pesan Online berhasil disalin!');
                                            }}
                                        >
                                            Salin
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-7 px-2 text-xs bg-[#FEB400] text-black hover:bg-[#e0a000]"
                                            title="Buka Halaman Pesan Online"
                                            onClick={() => window.open(`/order/${t.store_id}`, '_blank')}
                                        >
                                            Buka
                                        </Button>
                                    </div>
                                </div>

                                {/* Connected POS Devices Section */}
                                <div className="border rounded-lg p-2.5 mb-3 bg-muted/30">
                                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <Smartphone className="h-3.5 w-3.5 text-[#FEB400]" />
                                            <span>Perangkat POS Terhubung</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {t.devices?.filter((d: any) => d.status === 'active').length || 0} / {t.subscription_package?.max_devices_per_outlet || 2} Kuota
                                        </Badge>
                                    </div>
                                    
                                    {(!t.devices || t.devices.filter((d: any) => d.status === 'active').length === 0) ? (
                                        <p className="text-[11px] text-muted-foreground italic py-1">
                                            Belum ada perangkat POS yang terhubung ke cabang ini.
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {t.devices.filter((d: any) => d.status === 'active').map((device: any) => (
                                                <div key={device.id} className="flex items-center justify-between p-1.5 rounded bg-background border text-xs">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <div className="font-semibold truncate text-[11px] flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                            <span className="truncate">{device.device_name}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                                                            {device.device_model || 'Device'} • {device.last_active_at ? new Date(device.last_active_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Aktif'}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-1.5 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        title="Putuskan / Logout Perangkat POS"
                                                        onClick={() => handleRevokeDevice(device)}
                                                    >
                                                        <LogOut className="h-3 w-3 mr-1" /> Putuskan
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                        onClick={() => router.get('/owner/rooms')}
                                    >
                                        QR Meja ➔
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEditModal(t)}>
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                        {t.status === 'active' && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleSuspend(t)}
                                            >
                                                Nonaktifkan
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {tenants?.data?.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            Belum ada data outlet.
                        </div>
                    )}
                </div>
                <Pagination links={tenants?.links} />

                {/* Upgrade promo (jika sudah full) */}
                {!canAdd && packages.length > 0 && (
                    <Card className="border-dashed border-2 mt-2">
                        <CardHeader>
                            <CardTitle className="text-base">🚀 Butuh Lebih Banyak Outlet?</CardTitle>
                            <CardDescription>Upgrade paket Anda untuk mendaftarkan lebih banyak cabang.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-3">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="border rounded-lg p-3 hover:border-[#FEB400] transition-colors cursor-pointer">
                                        <div className="font-semibold text-sm">{pkg.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Max <span className="font-bold text-foreground">{pkg.max_outlets}</span> outlet
                                        </div>
                                        <div className="text-[#FEB400] font-bold text-sm mt-2">
                                            Rp{Number(pkg.price).toLocaleString('id-ID')}
                                            <span className="text-muted-foreground font-normal text-xs"> / {pkg.duration_in_days} hari</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Hubungi admin atau tim sales Kilatz untuk upgrade paket.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal Tambah */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Outlet Baru</DialogTitle>
                        <DialogDescription>
                            Daftarkan cabang atau toko baru Anda. Kasir dapat login ke outlet ini menggunakan Store ID.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="business_name">Nama Toko / Outlet</Label>
                                <Input
                                    id="business_name"
                                    placeholder="Contoh: Kilatz Cabang Selatan"
                                    value={formData.business_name}
                                    onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="store_id">
                                    Store ID <span className="text-xs text-muted-foreground">(unik, tidak bisa diubah)</span>
                                </Label>
                                <Input
                                    id="store_id"
                                    placeholder="kilatz-selatan"
                                    value={formData.store_id}
                                    onChange={e => setFormData({
                                        ...formData,
                                        store_id: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                                    })}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dan tanda (-). Digunakan kasir untuk login.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="business_address">Alamat (Opsional)</Label>
                                <Input
                                    id="business_address"
                                    placeholder="Jl. Contoh No. 1, Kota"
                                    value={formData.business_address}
                                    onChange={e => setFormData({ ...formData, business_address: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                Daftarkan Outlet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Outlet</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_business_name">Nama Toko</Label>
                                <Input
                                    id="edit_business_name"
                                    value={formData.business_name}
                                    onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Store ID</Label>
                                <Input value={formData.store_id} disabled className="bg-muted font-mono" />
                                <p className="text-xs text-muted-foreground">Store ID tidak bisa diubah.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_address">Alamat</Label>
                                <Input
                                    id="edit_address"
                                    value={formData.business_address}
                                    onChange={e => setFormData({ ...formData, business_address: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
