import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SessionDetail({ session, transactions }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount || 0);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Sesi Kasir', href: route('reports.sessions') }, { title: `Detail Sesi ${session.cashier?.name}`, href: route('reports.sessions.detail', session.id) }]}>
            <Head title={`Detail Sesi - ${session.cashier?.name}`} />
            
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link href={route('reports.sessions')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detail Sesi Kasir</h1>
                        <p className="text-muted-foreground mt-2">Kasir: {session.cashier?.name || 'Unknown'}</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Uang Awal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(session.starting_cash)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sistem Tercatat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(session.system_recorded_cash)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Uang Fisik</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(session.actual_cash_input)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Selisih</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${session.discrepancy < 0 ? 'text-red-500' : session.discrepancy > 0 ? 'text-green-500' : ''}`}>
                                {formatCurrency(session.discrepancy)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jam</TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Pembayaran</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Detail Pesanan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>
                                            {new Date(t.transacted_at).toLocaleTimeString('id-ID')}
                                        </TableCell>
                                        <TableCell className="font-medium">{t.receipt_number}</TableCell>
                                        <TableCell>
                                            <Badge variant={t.payment_method === 'cash' ? 'default' : 'secondary'}>
                                                {t.payment_method.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(t.total_amount)}</TableCell>
                                        <TableCell>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {t.items.map(item => (
                                                    <li key={item.id} className="text-sm">
                                                        <span className={item.is_cancelled ? 'line-through text-muted-foreground' : ''}>
                                                            {item.quantity}x {item.product_name}
                                                        </span>
                                                        {item.is_cancelled && (
                                                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0 h-4">Batal</Badge>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                            Tidak ada transaksi di sesi ini.
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
