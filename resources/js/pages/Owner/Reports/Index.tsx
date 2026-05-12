import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BadgeDollarSign, ReceiptText, TrendingUp, Package, Calendar as CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import * as reports from '@/routes/owner/reports';

export default function ReportsIndex({ date, dailyStats, topProducts, weeklyRevenue }: any) {
    const [selectedDate, setSelectedDate] = useState(date);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Penjualan', href: reports.index.url() },
    ];

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(reports.index.url(), { date: selectedDate }, { preserveState: true });
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan & Analitik" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Laporan & Analitik</h2>
                        <p className="text-muted-foreground text-sm">Pantau performa penjualan dan operasional bisnis Anda.</p>
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
                    <Card className="bg-gradient-to-br from-[#FEB400]/20 to-transparent border-[#FEB400]/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
                            <BadgeDollarSign className="h-5 w-5 text-[#FEB400]" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-[#FEB400]">{formatRupiah(dailyStats.total_sales)}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pada {date}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                            <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{dailyStats.transaction_count} <span className="text-lg font-normal text-muted-foreground">struk</span></div>
                            <p className="text-xs text-muted-foreground mt-1">Struk tercetak hari ini</p>
                        </CardContent>
                    </Card>
                    <Card className="hidden lg:block">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata per Transaksi</CardTitle>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {formatRupiah(dailyStats.transaction_count > 0 ? dailyStats.total_sales / dailyStats.transaction_count : 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Average order value (AOV)</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
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
            </div>
        </AppLayout>
    );
}
