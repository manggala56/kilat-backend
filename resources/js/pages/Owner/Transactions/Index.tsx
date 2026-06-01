import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, TrendingUp, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TransactionsIndex({ transactions, stats, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Transaksi', href: '/owner/transactions' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/transactions', { 
            search, 
            status: status !== 'all' ? status : '', 
            date_from: dateFrom, 
            date_to: dateTo 
        }, { preserveState: true });
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Riwayat Transaksi</h2>
                    <p className="text-muted-foreground text-sm">Pantau semua transaksi penjualan dari kasir secara real-time.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{formatRupiah(stats.total_revenue || 0)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_transactions || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Penjualan</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-[#FEB400]">{formatRupiah(stats.average_basket || 0)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Cari No. Resi..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                    <SelectItem value="pending">Tertunda</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input type="date" className="w-auto" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Tanggal Mulai" />
                            <span className="text-muted-foreground">-</span>
                            <Input type="date" className="w-auto" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Tanggal Akhir" />
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Filter</Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Resi</TableHead>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Pembayaran</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Detail</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.map((trx: any) => (
                                    <TableRow key={trx.id}>
                                        <TableCell className="font-medium text-xs font-mono">{trx.receipt_number}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(trx.transacted_at).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>{trx.cashier?.name || '-'}</TableCell>
                                        <TableCell className="uppercase text-xs">{trx.payment_method}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatRupiah(trx.total_amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={trx.status === 'completed' ? 'default' : trx.status === 'cancelled' ? 'destructive' : 'secondary'} className={trx.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {trx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" onClick={() => router.get(`/owner/transactions/${trx.id}`)}>
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Tidak ada transaksi ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
