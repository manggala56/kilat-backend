import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Box } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as rawMaterials from '@/routes/owner/raw-materials';

interface RawMaterial {
    id: number;
    name: string;
    sku: string | null;
    unit: string;
    stock: number;
    cost_per_unit: number;
    is_active: boolean;
}

export default function RawMaterialsIndex({ rawMaterials: rawData, filters }: { rawMaterials: any, filters: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        unit: 'gram',
        stock: '0',
        cost_per_unit: '0',
        is_active: true
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bahan Baku', href: rawMaterials.index.url() },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(rawMaterials.index.url(), { search }, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '', sku: '', unit: 'gram', stock: '0', cost_per_unit: '0', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (item: RawMaterial) => {
        setEditingItem(item);
        setFormData({
            name: item.name, sku: item.sku || '', unit: item.unit,
            stock: item.stock.toString(), cost_per_unit: item.cost_per_unit.toString(), is_active: item.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            router.put(rawMaterials.update.url(editingItem.id), formData as any, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Bahan baku berhasil diperbarui'); },
                onError: () => toast.error('Terjadi kesalahan')
            });
        } else {
            router.post(rawMaterials.store.url(), formData as any, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Bahan baku berhasil ditambahkan'); },
                onError: () => toast.error('Terjadi kesalahan')
            });
        }
    };

    const handleDelete = (item: RawMaterial) => {
        if (confirm(`Yakin ingin menghapus ${item.name}?`)) {
            router.delete(rawMaterials.destroy.url(item.id), {
                onSuccess: () => toast.success('Berhasil dihapus'),
                onError: () => toast.error('Terjadi kesalahan')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Bahan Baku" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Bahan Baku</h2>
                        <p className="text-muted-foreground text-sm">Kelola inventori bahan mentah dan modal (COGS).</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Cari nama bahan..." className="pl-8 w-full md:w-[250px]" value={search} onChange={e => setSearch(e.target.value)} />
                        </form>
                        <Button onClick={openCreateModal} className="bg-[#FEB400] text-black hover:bg-[#e0a000] shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Bahan Baku
                        </Button>
                    </div>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Box className="h-5 w-5 text-muted-foreground" /> Daftar Material
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Bahan</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Sisa Stok</TableHead>
                                    <TableHead className="text-right">Modal / Unit</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rawData.data.map((item: RawMaterial) => (
                                    <TableRow key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{item.sku || '-'}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {item.stock} <span className="text-muted-foreground text-xs font-normal">{item.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-orange-600 font-medium">
                                            {formatRupiah(item.cost_per_unit)}<span className="text-muted-foreground text-xs font-normal ml-1">/{item.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.is_active ? <Badge className="bg-green-500">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rawData.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada data bahan baku.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle>
                        <DialogDescription>Bahan baku ini akan digunakan dalam Resep/Bill of Materials produk.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Bahan</Label>
                                <Input id="name" placeholder="Contoh: Biji Kopi Arabica" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU (Opsional)</Label>
                                    <Input id="sku" placeholder="RM-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Satuan Unit</Label>
                                    <Select value={formData.unit} onValueChange={v => setFormData({...formData, unit: v})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gram">Gram (g)</SelectItem>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                            <SelectItem value="ml">Mililiter (ml)</SelectItem>
                                            <SelectItem value="liter">Liter (L)</SelectItem>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="cup">Cup</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stok Awal</Label>
                                    <Input id="stock" type="number" step="0.01" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cost">Modal / Unit (Rp)</Label>
                                    <Input id="cost" type="number" step="0.01" placeholder="150" value={formData.cost_per_unit} onChange={e => setFormData({...formData, cost_per_unit: e.target.value})} required />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                {editingItem ? 'Simpan Perubahan' : 'Tambah Bahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
