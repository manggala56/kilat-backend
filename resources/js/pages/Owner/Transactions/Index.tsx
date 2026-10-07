import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Search, FileText, TrendingUp, ShoppingCart, DollarSign, Eye, Printer, 
    Bell, CheckCircle2, Clock, Volume2, Utensils, Phone, User, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Pagination } from '@/components/Pagination';
import { toast } from 'sonner';
import { speakText, announcePaidOnlineOrder, announcePendingOnlineOrder } from '@/utils/voiceAnnouncer';

import { useOrderSignalListener, FullTransactionDetail } from '@/hooks/useOrderSignalListener';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TransactionsIndex({ transactions, stats, chartData, paymentMethodsData, filters, employees }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [cashierId, setCashierId] = useState(filters.cashier_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    
    // Reactive live transactions list
    const [liveTransactionsList, setLiveTransactionsList] = useState<any[]>(transactions.data || []);

    useEffect(() => {
        setLiveTransactionsList(transactions.data || []);
    }, [transactions.data]);

    // Popup state for General Receipt Detail
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Popup state for Bar / Kitchen Slip Printing
    const [barSlipTrx, setBarSlipTrx] = useState<any>(null);

    // Realtime Push-to-Pull Firebase / Web Push Signal Listener
    useOrderSignalListener({
        onOrderReceived: (order: FullTransactionDetail, orderStatus: string) => {
            const formattedTrx = {
                id: order.id,
                receipt_number: order.invoice_number,
                table_number: order.table_number,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                payment_method: order.payment_type?.toLowerCase() || (orderStatus === 'PAID' ? 'qris' : 'cash'),
                total_amount: order.total_amount,
                status: orderStatus === 'PAID' ? 'completed' : 'pending',
                transacted_at: order.created_at,
                items: order.items,
            };

            setLiveTransactionsList((prev) => {
                const filtered = prev.filter((t) => t.id !== order.id);
                return [formattedTrx, ...filtered];
            });

            if (orderStatus === 'PAID') {
                setBarSlipTrx(formattedTrx);
            }
        },
    });

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
        { title: 'Transaksi & Pesanan Online', href: '/owner/transactions' },
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
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    // Konfirmasi pesanan online pending dari kasir
    const handleConfirmOnlineOrder = (trx: any) => {
        router.post(`/owner/transactions/${trx.id}/confirm-online`, {}, {
            onSuccess: () => {
                toast.success(`Pesanan Meja ${trx.table_number || '-'} berhasil dikonfirmasi lunas!`);
                announcePaidOnlineOrder(trx.table_number || 'Pelanggan', trx.total_amount);
                setLiveTransactionsList((prev) =>
                    prev.map((t) => (t.id === trx.id ? { ...t, status: 'completed' } : t))
                );
            },
            onError: () => {
                toast.error('Gagal mengonfirmasi pesanan online');
            }
        });
    };

    // Filter pending online orders
    const pendingOnlineOrders = liveTransactionsList.filter((t: any) => t.status === 'pending');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Transaksi & Pesanan Masuk" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Transaksi & Pesanan Online</h2>
                            {pendingOnlineOrders.length > 0 && (
                                <Badge className="bg-amber-500 text-black font-bold animate-pulse">
                                    {pendingOnlineOrders.length} Pesanan Masuk (Pending)
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">Pantau transaksi kasir, pesan online dari meja, dan konfirmasi pembayaran.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => speakText("Sistem notifikasi suara transaksi Kilatz aktif.")}
                            className="text-xs flex items-center gap-1.5"
                            title="Uji coba suara notifikasi"
                        >
                            <Volume2 className="h-3.5 w-3.5 text-[#FEB400]" /> Tes Suara
                        </Button>
                        <Button onClick={() => window.print()} variant="outline" size="sm" className="flex items-center gap-2 text-xs">
                            <Printer className="h-4 w-4" /> Cetak Laporan
                        </Button>
                    </div>
                </div>

                {/* Pending Online Orders Alert Box */}
                {pendingOnlineOrders.length > 0 && (
                    <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs print:hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-amber-600 animate-bounce" />
                                Pesanan Online Masuk yang Menunggu Pembayaran di Kasir ({pendingOnlineOrders.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {pendingOnlineOrders.map((trx: any) => (
                                    <div key={trx.id} className="p-3 bg-background rounded-xl border shadow-2xs space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge className="bg-[#FEB400] text-black font-bold text-[11px]">
                                                    {trx.table_number || 'Takeaway'}
                                                </Badge>
                                                <h4 className="font-bold text-xs text-foreground mt-1">{trx.customer_name || 'Pelanggan'}</h4>
                                                {trx.customer_phone && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-2.5 w-2.5" /> {trx.customer_phone}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-xs text-[#FEB400]">{formatRupiah(trx.total_amount)}</span>
                                        </div>

                                        <div className="text-[11px] text-muted-foreground border-y py-1 max-h-16 overflow-y-auto space-y-0.5">
                                            {trx.items?.map((it: any) => (
                                                <div key={it.id} className="flex justify-between">
                                                    <span className="truncate">{it.product_name} x{it.quantity}</span>
                                                    <span>{formatRupiah(it.subtotal)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5 pt-1">
                                            <Button 
                                                size="sm"
                                                onClick={() => handleConfirmOnlineOrder(trx)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 font-semibold"
                                            >
                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Terima & Lunas
                                            </Button>
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setBarSlipTrx(trx)}
                                                className="text-[11px] h-7 px-2"
                                                title="Cetak Struk Bar / Dapur"
                                            >
                                                <Printer className="h-3 w-3 text-blue-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Printable Header */}
                <div className="hidden print:block mb-4">
                    <h2 className="text-2xl font-bold">Laporan Riwayat Transaksi</h2>
                    <p>Periode: {dateFrom || 'Awal'} s/d {dateTo || 'Sekarang'}</p>
                </div>

                {/* Stats Summary */}
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
                            <CardTitle className="text-sm font-medium">Total Transaksi Selesai</CardTitle>
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

                {/* Table Transactions */}
                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4 border-b print:hidden">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Cari No. Resi / Pelanggan / Meja..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="completed">Selesai / Lunas</SelectItem>
                                    <SelectItem value="pending">Tertunda / Pending</SelectItem>
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
                                    <TableHead>Meja / Pelanggan</TableHead>
                                    <TableHead>Pembayaran</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {liveTransactionsList.map((trx: any) => (
                                    <TableRow key={trx.id}>
                                        <TableCell>
                                            <button onClick={() => { setSelectedTrx(trx); setIsDetailOpen(true); }} className="font-medium text-xs font-mono text-blue-600 hover:underline">
                                                {trx.receipt_number}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(trx.transacted_at || trx.created_at).toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-xs">
                                                {trx.table_number ? (
                                                    <span className="text-[#FEB400] font-bold mr-1.5">[{trx.table_number}]</span>
                                                ) : null}
                                                <span>{trx.customer_name || trx.cashier?.name || 'Kasir'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="uppercase text-xs font-semibold">{trx.payment_method}</TableCell>
                                        <TableCell className="text-right font-semibold text-xs">{formatRupiah(trx.total_amount)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                variant={trx.status === 'completed' ? 'default' : trx.status === 'pending' ? 'secondary' : 'destructive'} 
                                                className={trx.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600 text-xs' : trx.status === 'pending' ? 'bg-amber-500 text-black text-xs font-semibold' : 'text-xs'}
                                            >
                                                {trx.status === 'completed' ? 'Lunas' : trx.status === 'pending' ? 'Pending' : trx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right print:hidden">
                                            <div className="flex justify-end gap-1.5">
                                                {trx.status === 'pending' && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleConfirmOnlineOrder(trx)}
                                                        className="h-7 px-2 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                                        title="Konfirmasi Pembayaran Lunas"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Konfirmasi
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setBarSlipTrx(trx)}
                                                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                                                    title="Cetak Struk Bar / Dapur"
                                                >
                                                    <Utensils className="h-3.5 w-3.5 mr-1" /> Struk Bar
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => { setSelectedTrx(trx); setIsDetailOpen(true); }}
                                                    className="h-7 w-7 p-0"
                                                    title="Lihat Detail Transaksi"
                                                >
                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {liveTransactionsList.length === 0 && (
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

            {/* Popup Detail Transaksi Kasir */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Rincian struk dan item belanja transaksi kasir.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTrx && (
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-muted-foreground">No. Resi / Nota:</span>
                                <span className="font-mono font-bold">{selectedTrx.receipt_number}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-muted-foreground">Pelanggan / Meja:</span>
                                <span className="font-bold text-[#FEB400]">{selectedTrx.table_number || '-'} ({selectedTrx.customer_name || 'Umum'})</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-muted-foreground">Waktu:</span>
                                <span>{new Date(selectedTrx.transacted_at || selectedTrx.created_at).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-muted-foreground">Metode Pembayaran:</span>
                                <span className="uppercase font-bold">{selectedTrx.payment_method}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-muted-foreground mb-2 uppercase tracking-wider">Item Belanja:</h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 bg-muted/20 p-2.5 rounded-xl">
                                    {selectedTrx.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-xs">
                                            <div>
                                                <span className="font-semibold">{item.product_name}</span>
                                                <div className="text-muted-foreground text-[10px]">{item.quantity} x {formatRupiah(item.unit_price)}</div>
                                                {item.notes && <p className="text-[10px] text-amber-600 italic">Catatan: {item.notes}</p>}
                                            </div>
                                            <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-base text-emerald-600">
                                <span>TOTAL</span>
                                <span>{formatRupiah(selectedTrx.total_amount)}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Popup Struk Khusus Bar / Dapur (Printable Bar Slip) */}
            {barSlipTrx && (
                <Dialog open={Boolean(barSlipTrx)} onOpenChange={(open) => !open && setBarSlipTrx(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                <Utensils className="h-4 w-4 text-[#FEB400]" /> Struk Pesanan Bar / Dapur
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Pratinjau tiket pesanan sebelum dicetak ke printer bar atau dapur.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-white text-black p-4 rounded-xl border font-mono text-xs space-y-3 my-2 shadow-xs">
                            <div className="text-center border-b pb-2">
                                <h3 className="font-extrabold text-sm uppercase">PESANAN BAR / DAPUR</h3>
                                <p className="text-[11px] text-gray-600">No: {barSlipTrx.receipt_number}</p>
                                <p className="text-[10px] text-gray-500">{new Date(barSlipTrx.transacted_at || barSlipTrx.created_at).toLocaleString('id-ID')}</p>
                            </div>

                            <div className="space-y-0.5 border-b pb-2 text-[11px]">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Meja:</span>
                                    <span className="font-bold text-base">{barSlipTrx.table_number || 'Takeaway'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pelanggan:</span>
                                    <span className="font-bold">{barSlipTrx.customer_name || 'Pelanggan'}</span>
                                </div>
                            </div>

                            <div className="space-y-2 py-1">
                                {barSlipTrx.items?.map((it: any, index: number) => (
                                    <div key={index} className="space-y-0.5">
                                        <div className="flex justify-between font-bold text-xs">
                                            <span>[{it.quantity}x] {it.product_name}</span>
                                        </div>
                                        {it.notes && (
                                            <p className="text-[10px] text-red-600 pl-3">
                                                * Catatan: {it.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-2 text-center text-[10px] text-gray-400">
                                -- Kilatz Kitchen & Bar System --
                            </div>
                        </div>

                        <Button 
                            type="button" 
                            onClick={() => window.print()}
                            className="w-full bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000]"
                        >
                            <Printer className="h-4 w-4 mr-2" /> Cetak ke Printer Bar / Dapur
                        </Button>
                    </DialogContent>
                </Dialog>
            )}

        </AppLayout>
    );
}
