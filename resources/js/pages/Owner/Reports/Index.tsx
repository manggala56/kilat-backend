import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BadgeDollarSign, ReceiptText, TrendingUp, Package, Calendar as CalendarIcon, Wallet, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import * as reports from '@/routes/owner/reports';

type TabType = 'PL' | 'CASH_FLOW' | 'BALANCE_SHEET' | 'CATEGORIES';

export default function ReportsIndex({ date, dailyStats, cashFlow, balanceSheet, categoryBreakdown, topProducts, weeklyRevenue }: any) {
    const [selectedDate, setSelectedDate] = useState(date);
    const [activeTab, setActiveTab] = useState<TabType>('PL');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Penjualan', href: reports.index.url() },
    ];

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(reports.index.url(), { date: selectedDate }, { preserveState: true });
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);

    const chartData = weeklyRevenue.map((item: any) => {
        const d = new Date(item.date);
        return {
            name: `${d.getDate()}/${d.getMonth() + 1}`,
            revenue: parseFloat(item.revenue),
            fullDate: item.date,
        };
    });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded shadow-md p-3">
                    <p className="font-semibold mb-1">{payload[0].payload.fullDate}</p>
                    <p className="text-[#FEB400] font-bold">{formatRupiah(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    // Calculate Cash Flow Inflow Total and Outflow Total
    const totalInflow = (cashFlow.inflow_cash || 0) + (cashFlow.inflow_qris || 0) + (cashFlow.inflow_debit || 0);
    const totalOutflow = (dailyStats.total_expenses || 0) + (dailyStats.total_payrolls || 0);
    const netCashFlow = totalInflow - totalOutflow;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan & Analitik" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header and Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Laporan Keuangan & Analitik</h2>
                        <p className="text-muted-foreground text-sm">Laporan keuangan profesional POS Kilatz mencakup Laba Rugi, Arus Kas, dan Neraca.</p>
                    </div>
                    <form onSubmit={handleFilter} className="flex items-end gap-2 bg-muted/30 p-2 rounded-lg border">
                        <div className="grid gap-1.5">
                            <Label htmlFor="date" className="text-xs text-muted-foreground ml-1">Pilih Tanggal</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="date" type="date" className="pl-8 w-[150px] h-9" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                            </div>
                        </div>
                        <Button type="submit" size="sm" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Filter</Button>
                    </form>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-muted gap-2">
                    <Button 
                        variant={activeTab === 'PL' ? 'default' : 'ghost'} 
                        onClick={() => setActiveTab('PL')} 
                        className={activeTab === 'PL' ? 'bg-[#FEB400] text-black hover:bg-[#e0a000]' : ''}
                    >
                        📈 Laba Rugi
                    </Button>
                    <Button 
                        variant={activeTab === 'CASH_FLOW' ? 'default' : 'ghost'} 
                        onClick={() => setActiveTab('CASH_FLOW')}
                        className={activeTab === 'CASH_FLOW' ? 'bg-[#FEB400] text-black hover:bg-[#e0a000]' : ''}
                    >
                        💸 Arus Kas
                    </Button>
                    <Button 
                        variant={activeTab === 'BALANCE_SHEET' ? 'default' : 'ghost'} 
                        onClick={() => setActiveTab('BALANCE_SHEET')}
                        className={activeTab === 'BALANCE_SHEET' ? 'bg-[#FEB400] text-black hover:bg-[#e0a000]' : ''}
                    >
                        🏛️ Neraca Keuangan
                    </Button>
                    <Button 
                        variant={activeTab === 'CATEGORIES' ? 'default' : 'ghost'} 
                        onClick={() => setActiveTab('CATEGORIES')}
                        className={activeTab === 'CATEGORIES' ? 'bg-[#FEB400] text-black hover:bg-[#e0a000]' : ''}
                    >
                        🏷️ Detail Kategori
                    </Button>
                </div>

                {/* TAB CONTENT: LABA RUGI */}
                {activeTab === 'PL' && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-gradient-to-br from-[#FEB400]/20 to-transparent border-[#FEB400]/50">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Laba Bersih (Net)</CardTitle>
                                    <BadgeDollarSign className="h-5 w-5 text-[#FEB400]" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-[#FEB400]">{formatRupiah(dailyStats.net_profit)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Laba kotor dikurangi biaya & gaji</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Laba Kotor (Gross)</CardTitle>
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{formatRupiah(dailyStats.gross_profit)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Penjualan dikurangi HPP (COGS)</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                                    <ReceiptText className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{formatRupiah(dailyStats.total_sales)}</div>
                                    <div className="flex justify-between mt-2 text-xs border-t pt-2 gap-2">
                                        <div>
                                            <span className="text-muted-foreground">F&B: </span>
                                            <span className="font-semibold text-green-600">{formatRupiah(dailyStats.fnb_sales)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Room: </span>
                                            <span className="font-semibold text-blue-600">{formatRupiah(dailyStats.room_sales)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">{dailyStats.transaction_count} Transaksi ({date})</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                                    <TrendingUp className="h-5 w-5 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-red-500">
                                        {formatRupiah(dailyStats.total_expenses + dailyStats.total_payrolls)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Pengeluaran harian ({formatRupiah(dailyStats.total_expenses)}) + Gaji dibayar ({formatRupiah(dailyStats.total_payrolls)})</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-2">
                            <Card className="col-span-1 lg:col-span-4">
                                <CardHeader>
                                    <CardTitle>Pendapatan 7 Hari Terakhir</CardTitle>
                                    <CardDescription>Tren penjualan kotor mingguan Anda</CardDescription>
                                </CardHeader>
                                <CardContent className="px-2">
                                    {chartData.length > 0 ? (
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#FEB400" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="#FEB400" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `Rp${v / 1000}k`} dx={-10} />
                                                    <RechartsTooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey="revenue" stroke="#FEB400" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded border border-dashed">
                                            Belum ada data penjualan 7 hari terakhir
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="col-span-1 lg:col-span-3 flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" /> Top 10 Produk Terlaris
                                    </CardTitle>
                                    <CardDescription>Pada tanggal {date}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-0">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Total (Rp)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topProducts.map((product: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}.</span>
                                                            {product.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{product.quantity}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-[#FEB400] font-medium">
                                                        {formatRupiah(product.total)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {topProducts.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                                        Belum ada produk terjual hari ini.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}

                {/* TAB CONTENT: ARUS KAS */}
                {activeTab === 'CASH_FLOW' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* KAS MASUK */}
                        <Card>
                            <CardHeader className="bg-green-500/10 border-b border-green-500/20">
                                <CardTitle className="flex items-center gap-2 text-green-700">
                                    <ArrowUpRight className="h-5 w-5" /> Arus Kas Masuk (Inflow)
                                </CardTitle>
                                <CardDescription>Penerimaan kas harian berdasarkan metode transaksi.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="font-semibold text-muted-foreground">Penerimaan CASH:</span>
                                    <span className="font-bold">{formatRupiah(cashFlow.inflow_cash)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="font-semibold text-muted-foreground">Penerimaan QRIS:</span>
                                    <span className="font-bold">{formatRupiah(cashFlow.inflow_qris)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="font-semibold text-muted-foreground">Penerimaan DEBIT:</span>
                                    <span className="font-bold">{formatRupiah(cashFlow.inflow_debit)}</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-green-600 bg-green-500/5 px-2 rounded">
                                    <span className="font-bold text-green-700 text-lg">Total Kas Masuk:</span>
                                    <span className="font-extrabold text-green-700 text-lg">{formatRupiah(totalInflow)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KAS KELUAR */}
                        <Card>
                            <CardHeader className="bg-red-500/10 border-b border-red-500/20">
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <ArrowDownRight className="h-5 w-5" /> Arus Kas Keluar (Outflow)
                                </CardTitle>
                                <CardDescription>Pengeluaran kas operasional dan penggajian.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-sm text-red-700">Detail Pengeluaran Operasional</h4>
                                    {cashFlow.expenses_list.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="py-1 h-8 text-[11px]">Nama</TableHead>
                                                    <TableHead className="py-1 h-8 text-[11px]">Kategori</TableHead>
                                                    <TableHead className="text-right py-1 h-8 text-[11px]">Jumlah</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cashFlow.expenses_list.map((exp: any) => (
                                                    <TableRow key={exp.id}>
                                                        <TableCell className="py-1 font-medium text-xs">{exp.name}</TableCell>
                                                        <TableCell className="py-1 text-xs">{exp.category}</TableCell>
                                                        <TableCell className="text-right py-1 text-xs font-semibold">{formatRupiah(exp.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">Tidak ada pengeluaran hari ini.</p>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-muted">
                                    <h4 className="font-bold text-sm text-red-700">Detail Penggajian (Paid)</h4>
                                    {cashFlow.payrolls_list.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="py-1 h-8 text-[11px]">Karyawan</TableHead>
                                                    <TableHead className="text-right py-1 h-8 text-[11px]">Gaji Bersih</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cashFlow.payrolls_list.map((pr: any) => (
                                                    <TableRow key={pr.id}>
                                                        <TableCell className="py-1 font-medium text-xs">{pr.employee?.name || 'Karyawan'}</TableCell>
                                                        <TableCell className="text-right py-1 text-xs font-semibold">{formatRupiah(pr.net_salary)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">Tidak ada pembayaran gaji hari ini.</p>
                                    )}
                                </div>

                                <div className="flex justify-between py-3 border-t-2 border-red-600 bg-red-500/5 px-2 rounded">
                                    <span className="font-bold text-red-700 text-lg">Total Kas Keluar:</span>
                                    <span className="font-extrabold text-red-700 text-lg">{formatRupiah(totalOutflow)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* NET CASH FLOW SUMMARY CARD */}
                        <Card className="col-span-2 bg-[#FEB400]/5 border-[#FEB400]/30">
                            <CardContent className="flex justify-between items-center py-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">Arus Kas Bersih (Net Cash Flow)</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Sisa kas harian setelah penerimaan dikurangi pengeluaran.</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-black ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {netCashFlow >= 0 ? '+' : ''}{formatRupiah(netCashFlow)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB CONTENT: NERACA KEUANGAN */}
                {activeTab === 'BALANCE_SHEET' && (
                    <Card className="mt-2">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-muted-foreground" /> Neraca Saldo Keuangan (Balance Sheet)
                            </CardTitle>
                            <CardDescription>Menunjukkan kondisi aset, kewajiban, dan ekuitas modal bisnis Anda per tanggal {date}.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-[50%] font-bold text-gray-900 text-sm">AKTIVA (ASET)</TableHead>
                                        <TableHead className="w-[50%] font-bold text-gray-900 text-sm">PASIVA (KEWAJIBAN & EKUITAS)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell className="p-0 align-top border-r">
                                            {/* Aktiva Lancar */}
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <h4 className="font-bold text-xs text-[#FEB400] uppercase tracking-wider mb-2">Aset Lancar</h4>
                                                    <div className="flex justify-between py-1.5 border-b text-xs">
                                                        <span>Kas & Setara Kas</span>
                                                        <span className="font-semibold">{formatRupiah(balanceSheet.cash_asset)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-1.5 border-b text-xs">
                                                        <span>Persediaan (Produk & Bahan Baku)</span>
                                                        <span className="font-semibold">{formatRupiah(balanceSheet.inventory_asset)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-0 align-top">
                                            {/* Pasiva */}
                                            <div className="p-4 space-y-6">
                                                <div>
                                                    <h4 className="font-bold text-xs text-red-600 uppercase tracking-wider mb-2">Kewajiban Jangka Pendek</h4>
                                                    <div className="flex justify-between py-1.5 border-b text-xs">
                                                        <span>Hutang Gaji Karyawan (Pending)</span>
                                                        <span className="font-semibold">{formatRupiah(balanceSheet.liabilities)}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-xs text-green-600 uppercase tracking-wider mb-2">Ekuitas Modal</h4>
                                                    <div className="flex justify-between py-1.5 border-b text-xs">
                                                        <span>Modal Pemilik & Laba Ditahan</span>
                                                        <span className="font-semibold">{formatRupiah(balanceSheet.equity)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    
                                    {/* Total Aktiva vs Pasiva */}
                                    <TableRow className="bg-[#FEB400]/5 font-bold hover:bg-[#FEB400]/5 border-t-2">
                                        <TableCell className="border-r py-3 flex justify-between text-sm">
                                            <span>TOTAL ASET (AKTIVA):</span>
                                            <span className="text-primary-700 font-extrabold">{formatRupiah(balanceSheet.total_assets)}</span>
                                        </TableCell>
                                        <TableCell className="py-3 flex justify-between text-sm">
                                            <span>TOTAL PASIVA (KEWAJIBAN + EKUITAS):</span>
                                            <span className="text-primary-700 font-extrabold">{formatRupiah(balanceSheet.liabilities + balanceSheet.equity)}</span>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* TAB CONTENT: DETAIL KATEGORI */}
                {activeTab === 'CATEGORIES' && (
                    <Card className="mt-2">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" /> Laporan Pendapatan Berdasarkan Kategori
                            </CardTitle>
                            <CardDescription>Rincian performa penjualan terperinci per kategori produk hari ini.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Kategori</TableHead>
                                        <TableHead>Tipe Kategori</TableHead>
                                        <TableHead className="text-center">Kuantitas Terjual</TableHead>
                                        <TableHead className="text-right">Pendapatan Kotor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryBreakdown.map((cat: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-semibold">{cat.category_name}</TableCell>
                                            <TableCell>
                                                <Badge variant={cat.category_type === 'ROOM' ? 'default' : cat.category_type === 'FOOD' ? 'secondary' : 'outline'}>
                                                    {cat.category_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="px-2 py-0.5">{cat.quantity} unit</Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-[#FEB400] font-bold">
                                                {formatRupiah(cat.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {categoryBreakdown.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                Belum ada produk terjual hari ini.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
