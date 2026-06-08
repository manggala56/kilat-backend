import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

export default function ProductsIndex({ products, categories, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', category_id: '', sku: '', price: '', stock: '', margin_percentage: '' });

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search || categoryId !== filters?.category_id) {
                router.get('/owner/products', { search, category_id: categoryId }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, categoryId]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produk', href: '/owner/products' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/products', { search, category_id: categoryId }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            router.put(`/owner/products/${currentId}`, form, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Produk berhasil diperbarui');
                },
            });
        } else {
            router.post('/owner/products', form, {
                onSuccess: () => {
                    setIsOpen(false);
                    setForm({ name: '', category_id: '', sku: '', price: '', stock: '', margin_percentage: '' });
                    toast.success('Produk berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (prod: any) => {
        setIsEdit(true);
        setCurrentId(prod.id);
        setForm({ 
            name: prod.name, 
            category_id: prod.category_id?.toString() || '', 
            sku: prod.sku || '', 
            price: prod.price?.toString() || '', 
            stock: prod.stock?.toString() || '',
            margin_percentage: prod.margin_percentage?.toString() || ''
        });
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menonaktifkan produk ini?')) {
            router.delete(`/owner/products/${id}`, {
                onSuccess: () => toast.success('Produk berhasil dinonaktifkan')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Produk" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Katalog Produk</h2>
                        <p className="text-muted-foreground text-sm">Kelola produk dan harga jual untuk kasir.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Cari produk..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Button type="submit" variant="secondary">Cari</Button>
                        </form>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setIsEdit(false); setForm({ name: '', category_id: '', sku: '', price: '', stock: '', margin_percentage: '' }); }} className="bg-[#FEB400] text-black hover:bg-[#e0a000] w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{isEdit ? 'Edit Produk' : 'Produk Baru'}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>Nama Produk</Label>
                                            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Kategori</Label>
                                            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                                                <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>SKU (Opsional)</Label>
                                            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Harga Jual (Manual)</Label>
                                            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Kosongkan jika pakai margin" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Margin Persentase (%)</Label>
                                            <Input type="number" step="0.01" value={form.margin_percentage} onChange={(e) => setForm({ ...form, margin_percentage: e.target.value })} placeholder="Opsional (Misal: 20)" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Stok Awal</Label>
                                            <Input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                        {isEdit ? 'Simpan Perubahan' : 'Tambahkan Produk'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" /> Daftar Produk
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Produk</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-center">Stok</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((prod: any) => (
                                    <TableRow key={prod.id}>
                                        <TableCell className="font-medium">{prod.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{prod.sku || '-'}</TableCell>
                                        <TableCell>{prod.category?.name || '-'}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatRupiah(prod.price)}</TableCell>
                                        <TableCell className="text-center">
                                            {prod.stock <= (prod.low_stock_threshold || 10) ? (
                                                <Badge variant="destructive">{prod.stock}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-50 text-green-700">{prod.stock}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(prod)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(prod.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Tidak ada produk ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={products.links} />
            </div>
        </AppLayout>
    );
}
