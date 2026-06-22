import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/Pagination';
import { Printer, AlertCircle, Activity } from 'lucide-react';

export default function CashierSessions({ sessions, stats, filters }) {
    const [month, setMonth] = useState(filters?.month || '');

    useEffect(() => {
        const delay = setTimeout(() => {
            if (month !== (filters?.month || '')) {
                router.get('/owner/reports/sessions', { month }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [month]);
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount || 0);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Sesi Kasir', href: '/owner/reports/sessions' }]}>
            <Head title="Laporan Sesi Kasir" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#FEB400]">Laporan Sesi Kasir</h1>
                        <p className="text-muted-foreground mt-2">Daftar sesi login kasir dan rekap pendapatan</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                            <Printer className="h-4 w-4" /> Cetak
                        </Button>
                        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
                    </div>
                </div>

                <div className="hidden print:block mb-4">
                    <h2 className="text-2xl font-bold">Laporan Sesi Kasir</h2>
                    <p>Periode: {month || 'Bulan Ini'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sesi Kasir</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.total_sessions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Selisih (Discrepancy)</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${stats?.total_discrepancy < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(stats?.total_discrepancy || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="print:hidden">
                        <CardTitle>Riwayat Sesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Mulai</TableHead>
                                    <TableHead>Selesai</TableHead>
                                    <TableHead>Uang Awal</TableHead>
                                    <TableHead>Total Sistem</TableHead>
                                    <TableHead>Uang Fisik</TableHead>
                                    <TableHead>Selisih</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.data.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-medium">
                                            {session.cashier?.name || 'Kasir'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(session.clock_in_time).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {session.clock_out_time ? new Date(session.clock_out_time).toLocaleString('id-ID') : 'Masih Aktif'}
                                        </TableCell>
                                        <TableCell>{formatCurrency(session.starting_cash)}</TableCell>
                                        <TableCell>{formatCurrency(session.system_ending_cash)}</TableCell>
                                        <TableCell>{formatCurrency(session.actual_ending_cash)}</TableCell>
                                        <TableCell>
                                            <span className={session.discrepancy < 0 ? 'text-red-500 font-bold' : session.discrepancy > 0 ? 'text-green-500 font-bold' : ''}>
                                                {formatCurrency(session.discrepancy)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right print:hidden">
                                            <Link href={`/owner/reports/sessions/${session.id}`}>
                                                <Button variant="outline" size="sm">
                                                    Lihat Detail
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sessions.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                                            Belum ada data sesi kasir.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="print:hidden">
                    <Pagination links={sessions?.links} />
                </div>
            </div>
        </AppLayout>
    );
}
