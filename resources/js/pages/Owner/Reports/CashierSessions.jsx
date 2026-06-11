import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function CashierSessions({ sessions }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount || 0);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Sesi Kasir', href: route('reports.sessions') }]}>
            <Head title="Laporan Sesi Kasir" />
            
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Laporan Sesi Kasir</h1>
                        <p className="text-muted-foreground mt-2">Daftar sesi login kasir dan rekap pendapatan</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
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
                                            {session.cashier?.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(session.clock_in_time).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {session.clock_out_time ? new Date(session.clock_out_time).toLocaleString('id-ID') : 'Masih Aktif'}
                                        </TableCell>
                                        <TableCell>{formatCurrency(session.starting_cash)}</TableCell>
                                        <TableCell>{formatCurrency(session.system_recorded_cash)}</TableCell>
                                        <TableCell>{formatCurrency(session.actual_cash_input)}</TableCell>
                                        <TableCell>
                                            <span className={session.discrepancy < 0 ? 'text-red-500 font-bold' : session.discrepancy > 0 ? 'text-green-500 font-bold' : ''}>
                                                {formatCurrency(session.discrepancy)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('reports.sessions.detail', session.id)}>
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
            </div>
        </OwnerLayout>
    );
}
