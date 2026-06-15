import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, TrendingUp, ShoppingCart, DollarSign, Eye, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Pagination } from '@/components/Pagination';
import { useEffect } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TransactionsIndex({ transactions, stats, chartData, paymentMethodsData, filters, employees }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [cashierId, setCashierId] = useState(filters.cashier_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    
    // Popup state
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search || status !== (filters?.status || 'all') || cashierId !== (filters?.cashier_id || 'all') || dateFrom !== (filters?.date_from || '') || dateTo !== (filters?.date_to || '')) {
                router.get('/owner/transactions', { 
                    search, 
                    status: status !== 'all' ? status : '', 
                    cashier_id: cashierId !== 'all' ? cashierId : '',
                    date_from: dateFrom, 
                    date_to: dateTo 
                }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, status, cashierId, dateFrom, dateTo]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Transaksi', href: '/owner/transactions' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/transactions', { 
            search, 
            status: status !== 'all' ? status : '', 
            cashier_id: cashierId !== 'all' ? cashierId : '',
            date_from: dateFrom, 
            date_to: dateTo 
        }, { preserveState: true });
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Riwayat Transaksi</h2>
                        <p className="text-muted-foreground text-sm">Pantau semua transaksi penjualan dari kasir secara real-time.</p>
                    </div>
                    <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Cetak Laporan
                    </Button>
                </div>

                <div className="hidden print:block mb-4">
                    <h2 className="text-2xl font-bold">Laporan Riwayat Transaksi</h2>
                    <p>Periode: {dateFrom || 'Awal'} s/d {dateTo || 'Sekarang'}</p>
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

                {/* Analytical Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Tren Pendapatan Harian</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {chartData && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} width={80} tickFormatter={(val) => `Rp${(val/1000)}k`} />
                                        <RechartsTooltip formatter={(value: any) => formatRupiah(Number(value))} />
                                        <Line type="monotone" dataKey="total" stroke="#FEB400" strokeWidth={2} name="Pendapatan" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Tidak ada data grafik</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Metode Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {paymentMethodsData && paymentMethodsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={paymentMethodsData} dataKey="total" nameKey="payment_method" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => entry.payment_method}>
                                            {paymentMethodsData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any) => formatRupiah(Number(value))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">Tidak ada data grafik</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4 border-b print:hidden">
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
                            <Select value={cashierId} onValueChange={setCashierId}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Kasir" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kasir</SelectItem>
                                    {employees?.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                                    ))}
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
                                        <TableCell>
                                            <button onClick={() => { setSelectedTrx(trx); setIsDetailOpen(true); }} className="font-medium text-xs font-mono text-blue-600 hover:underline">
                                                {trx.receipt_number}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(trx.transacted_at).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>{trx.cashier?.name || 'Kasir'}</TableCell>
                                        <TableCell className="uppercase text-xs">{trx.payment_method}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatRupiah(trx.total_amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={trx.status === 'completed' ? 'default' : trx.status === 'cancelled' ? 'destructive' : 'secondary'} className={trx.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {trx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center print:hidden">
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedTrx(trx); setIsDetailOpen(true); }}>
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
                <div className="print:hidden">
                    <Pagination links={transactions?.links} />
                </div>
            </div>

            {/* Popup Detail Transaksi */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                    </DialogHeader>
                    {selectedTrx && (
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium">No. Nota:</span>
                                <span className="font-mono">{selectedTrx.receipt_number}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium">Kasir:</span>
                                <span>{selectedTrx.cashier?.name || 'Kasir'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium">Waktu:</span>
                                <span>{new Date(selectedTrx.transacted_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium">Metode Pembayaran:</span>
                                <span className="uppercase">{selectedTrx.payment_method}</span>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Item Belanja:</h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-2">
                                    {selectedTrx.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <div>
                                                <span>{item.product_name}</span>
                                                <div className="text-muted-foreground text-xs">{item.quantity} x {formatRupiah(item.unit_price)}</div>
                                            </div>
                                            <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg text-emerald-600">
                                <span>TOTAL</span>
                                <span>{formatRupiah(selectedTrx.total_amount)}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
