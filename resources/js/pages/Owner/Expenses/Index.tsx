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
import { Plus, Edit2, Trash2, Wallet, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

export default function ExpensesIndex({ expenses, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [month, setMonth] = useState(filters.month || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', category: '', amount: '', expense_date: '', description: '' });

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search || month !== (filters?.month || '')) {
                router.get('/owner/expenses', { search, month }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, month]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengeluaran', href: '/owner/expenses' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/expenses', { search, month }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            router.put(`/owner/expenses/${currentId}`, form, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Pengeluaran berhasil diperbarui');
                },
            });
        } else {
            router.post('/owner/expenses', form, {
                onSuccess: () => {
                    setIsOpen(false);
                    setForm({ name: '', category: '', amount: '', expense_date: '', description: '' });
                    toast.success('Pengeluaran berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (expense: any) => {
        setIsEdit(true);
        setCurrentId(expense.id);
        setForm({ 
            name: expense.name, 
            category: expense.category, 
            amount: expense.amount?.toString() || '', 
            expense_date: expense.expense_date, 
            description: expense.description || '' 
        });
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus pengeluaran ini?')) {
            router.delete(`/owner/expenses/${id}`, {
                onSuccess: () => toast.success('Pengeluaran berhasil dihapus')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengeluaran Operasional" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Pengeluaran (Expenses)</h2>
                        <p className="text-muted-foreground text-sm">Catat biaya operasional seperti listrik, sewa, gaji, dll.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Cari nama/kategori..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Button type="submit" variant="secondary">Cari</Button>
                        </form>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setIsEdit(false); setForm({ name: '', category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], description: '' }); }} className="bg-[#FEB400] text-black hover:bg-[#e0a000] w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{isEdit ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Nama Pengeluaran</Label>
                                        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Misal: Tagihan Listrik" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Kategori</Label>
                                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                                <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="operational">Operasional</SelectItem>
                                                    <SelectItem value="utility">Utilitas (Listrik/Air)</SelectItem>
                                                    <SelectItem value="salary">Gaji & Upah</SelectItem>
                                                    <SelectItem value="marketing">Pemasaran</SelectItem>
                                                    <SelectItem value="other">Lain-lain</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tanggal</Label>
                                            <Input type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nominal (Rp)</Label>
                                        <Input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi Tambahan</Label>
                                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                    <Button type="submit" className="w-full bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                        {isEdit ? 'Simpan Perubahan' : 'Catat Pengeluaran'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-muted-foreground" /> Daftar Pengeluaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Nominal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.data.map((expense: any) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.expense_date}</TableCell>
                                        <TableCell className="font-medium">
                                            {expense.name}
                                            {expense.description && <p className="text-xs text-muted-foreground">{expense.description}</p>}
                                        </TableCell>
                                        <TableCell className="capitalize">{expense.category}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatRupiah(expense.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(expense.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {expenses.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada pengeluaran ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={expenses?.links} />
            </div>
        </AppLayout>
    );
}
