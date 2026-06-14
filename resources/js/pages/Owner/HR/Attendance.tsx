import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Clock, CalendarDays, Printer, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

export default function AttendanceIndex({ attendances, stats, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [month, setMonth] = useState(filters.month || '');

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== (filters?.search || '') || month !== (filters?.month || '')) {
                router.get('/owner/attendances', { search, month }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, month]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Absensi Karyawan', href: '/owner/attendances' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/attendances', { search }, { preserveState: true });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Absensi Karyawan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Laporan Absensi</h2>
                        <p className="text-muted-foreground text-sm">Lihat riwayat kehadiran (clock-in & clock-out) karyawan.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                            <Printer className="h-4 w-4" /> Cetak
                        </Button>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari karyawan..."
                                    className="pl-8 w-full"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button type="submit" variant="secondary">Cari</Button>
                        </form>
                    </div>
                </div>

                <div className="hidden print:block mb-4">
                    <h2 className="text-2xl font-bold">Laporan Absensi Karyawan</h2>
                    <p>Periode: {month || 'Bulan Ini'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hadir & Tepat Waktu</CardTitle>
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{stats?.total_present || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
                            <UserX className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats?.total_late || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-muted-foreground" /> Riwayat Kehadiran
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Shift</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Selisih Kas</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.data.map((att: any) => (
                                    <TableRow key={att.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                {att.employee?.name || 'Tidak diketahui'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{att.shift?.name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-green-500" />
                                                {formatDate(att.clock_in_time)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-red-500" />
                                                {formatDate(att.clock_out_time)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {att.discrepancy !== null ? (
                                                <span className={att.discrepancy < 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                                                    Rp {new Intl.NumberFormat('id-ID').format(att.discrepancy)}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {att.clock_out_time ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selesai Shift</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sedang Bekerja</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {attendances.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Tidak ada riwayat absensi ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="print:hidden">
                    <Pagination links={attendances?.links} />
                </div>
            </div>
        </AppLayout>
    );
}
