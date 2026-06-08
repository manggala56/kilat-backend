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
import { Plus, CheckCircle, Trash2, Banknote, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

export default function PayrollIndex({ payrolls, employees, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ 
        employee_id: '', 
        period_start: '', 
        period_end: '', 
        base_salary: '', 
        attendance_bonus: '0', 
        deductions: '0', 
        status: 'pending' 
    });

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search) {
                router.get('/owner/payrolls', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Penggajian', href: '/owner/payrolls' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/payrolls', { search }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/owner/payrolls', form, {
            onSuccess: () => {
                setIsOpen(false);
                setForm({ employee_id: '', period_start: '', period_end: '', base_salary: '', attendance_bonus: '0', deductions: '0', status: 'pending' });
                toast.success('Gaji berhasil di-generate');
            },
        });
    };

    const markAsPaid = (id: number) => {
        if (confirm('Tandai gaji ini sebagai Lunas (Sudah Dibayar)?')) {
            router.put(`/owner/payrolls/${id}`, { status: 'paid' }, {
                onSuccess: () => toast.success('Status gaji diperbarui menjadi Lunas')
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus data penggajian ini?')) {
            router.delete(`/owner/payrolls/${id}`, {
                onSuccess: () => toast.success('Data gaji berhasil dihapus')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Penggajian" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Penggajian Karyawan</h2>
                        <p className="text-muted-foreground text-sm">Kelola dan generate laporan gaji karyawan Anda.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <form onSubmit={handleSearch} className="flex relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari karyawan..."
                                className="pl-8 w-full md:w-[200px]"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <Button type="submit" variant="secondary" className="ml-2">Cari</Button>
                        </form>

                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#FEB400] text-black hover:bg-[#e0a000] w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Generate Gaji Baru
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Generate Slip Gaji</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Pilih Karyawan</Label>
                                        <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Pilih Karyawan" /></SelectTrigger>
                                            <SelectContent>
                                                {employees.map((emp: any) => (
                                                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Periode Mulai</Label>
                                            <Input type="date" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Periode Selesai</Label>
                                            <Input type="date" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gaji Pokok (Rp)</Label>
                                        <Input type="number" required value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Bonus (Rp)</Label>
                                            <Input type="number" value={form.attendance_bonus} onChange={(e) => setForm({ ...form, attendance_bonus: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Potongan (Rp)</Label>
                                            <Input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Gaji Bersih</Label>
                                        <div className="p-3 bg-muted rounded-md text-lg font-bold">
                                            {formatRupiah((Number(form.base_salary) || 0) + (Number(form.attendance_bonus) || 0) - (Number(form.deductions) || 0))}
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                        Simpan
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-muted-foreground" /> Daftar Slip Gaji
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead className="text-right">Gaji Pokok</TableHead>
                                    <TableHead className="text-center">Bonus/Potong</TableHead>
                                    <TableHead className="text-right">Gaji Bersih</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrolls.data.map((pr: any) => (
                                    <TableRow key={pr.id}>
                                        <TableCell className="font-medium">{pr.employee?.name}</TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(pr.period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} 
                                            {' - '} 
                                            {new Date(pr.period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                        </TableCell>
                                        <TableCell className="text-right">{formatRupiah(pr.base_salary)}</TableCell>
                                        <TableCell className="text-center text-xs text-muted-foreground">
                                            + {formatRupiah(pr.attendance_bonus)}<br/>
                                            - {formatRupiah(pr.deductions)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-green-600">{formatRupiah(pr.net_salary)}</TableCell>
                                        <TableCell className="text-center">
                                            {pr.status === 'paid' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Dibayar</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Tertunda</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {pr.status === 'pending' && (
                                                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => markAsPaid(pr.id)} title="Tandai Sudah Dibayar">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(pr.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payrolls.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Tidak ada data gaji ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Pagination links={payrolls?.links} />
            </div>
        </AppLayout>
    );
}
