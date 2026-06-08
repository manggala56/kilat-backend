import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';
import { Search } from 'lucide-react';

export default function ShiftsIndex({ shifts, filters }: any) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', start_time: '', end_time: '' });

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search) {
                router.get('/owner/shifts', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Shift', href: '/owner/shifts' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            router.put(`/owner/shifts/${currentId}`, form, {
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Shift berhasil diperbarui');
                },
            });
        } else {
            router.post('/owner/shifts', form, {
                onSuccess: () => {
                    setIsOpen(false);
                    setForm({ name: '', start_time: '', end_time: '' });
                    toast.success('Shift berhasil ditambahkan');
                },
            });
        }
    };

    const handleEdit = (shift: any) => {
        setIsEdit(true);
        setCurrentId(shift.id);
        setForm({ 
            name: shift.name, 
            start_time: shift.start_time.substring(0, 5), 
            end_time: shift.end_time.substring(0, 5) 
        });
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus shift ini?')) {
            router.delete(`/owner/shifts/${id}`, {
                onSuccess: () => toast.success('Shift berhasil dihapus')
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Shift" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Manajemen Shift</h2>
                        <p className="text-muted-foreground text-sm">Kelola jadwal shift untuk karyawan (HR).</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nama shift..."
                                className="pl-8 w-full md:w-[250px]"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setIsEdit(false); setForm({ name: '', start_time: '', end_time: '' }); }} className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Shift
                                </Button>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEdit ? 'Edit Shift' : 'Buat Shift Baru'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Nama Shift</Label>
                                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Misal: Shift Pagi" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jam Mulai</Label>
                                        <Input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Jam Selesai</Label>
                                        <Input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                    {isEdit ? 'Simpan Perubahan' : 'Buat Shift'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" /> Daftar Shift
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Shift</TableHead>
                                    <TableHead>Jam Mulai</TableHead>
                                    <TableHead>Jam Selesai</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.data.map((shift: any) => (
                                    <TableRow key={shift.id}>
                                        <TableCell className="font-medium">{shift.name}</TableCell>
                                        <TableCell>{shift.start_time}</TableCell>
                                        <TableCell>{shift.end_time}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(shift)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(shift.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {shifts.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Tidak ada shift ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={shifts?.links} />
            </div>
        </AppLayout>
    );
}
