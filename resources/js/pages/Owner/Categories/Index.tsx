import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Tags, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

export default function CategoriesIndex({ categories, filters }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', description: '', type: 'OTHER' });
    const [search, setSearch] = useState(filters?.search || '');

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search) {
                router.get('/owner/categories', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori', href: '/owner/categories' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            router.put(`/owner/categories/${currentId}`, form, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Kategori berhasil diperbarui');
                },
            });
        } else {
            router.post('/owner/categories', form, {
                onSuccess: () => {
                    setIsOpen(false);
                    setForm({ name: '', description: '', type: 'OTHER' });
                    toast.success('Kategori berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (cat: any) => {
        setIsEdit(true);
        setCurrentId(cat.id);
        setForm({ name: cat.name, description: cat.description || '', type: cat.type || 'OTHER' });
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            router.delete(`/owner/categories/${id}`, {
                onSuccess: () => toast.success('Kategori berhasil dihapus')
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kategori" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Manajemen Kategori</h2>
                        <p className="text-muted-foreground text-sm">Kelola kategori produk untuk mempermudah transaksi.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="search" 
                                placeholder="Cari kategori..." 
                                className="pl-8 w-full md:w-[250px]" 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setIsEdit(false); setForm({ name: '', description: '', type: 'OTHER' }); }} className="bg-[#FEB400] text-black hover:bg-[#e0a000] shrink-0">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
                                </Button>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEdit ? 'Edit Kategori' : 'Kategori Baru'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Nama Kategori</Label>
                                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cth: Minuman Dingin" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipe Kategori</Label>
                                    <select 
                                        required 
                                        value={form.type} 
                                        onChange={(e) => setForm({ ...form, type: e.target.value })} 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="FOOD">Makanan (FOOD)</option>
                                        <option value="DRINK">Minuman (DRINK)</option>
                                        <option value="ROOM">Sewa Ruangan (ROOM)</option>
                                        <option value="OTHER">Lainnya (OTHER)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Deskripsi (Opsional)</Label>
                                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cth: Aneka minuman dingin" />
                                </div>
                                <Button type="submit" className="w-full bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                    {isEdit ? 'Simpan Perubahan' : 'Tambahkan Kategori'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Tags className="h-5 w-5 text-muted-foreground" /> Daftar Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Kategori</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead className="text-center">Jumlah Produk</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.map((cat: any) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={cat.type === 'ROOM' ? 'default' : cat.type === 'FOOD' ? 'secondary' : 'outline'}>
                                                {cat.type || 'OTHER'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{cat.description || '-'}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[#FEB400] bg-orange-100 rounded-full">
                                                {cat.products_count} Produk
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(cat)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(cat.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {categories.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada kategori ditambahkan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={categories.links} />
            </div>
        </AppLayout>
    );
}
