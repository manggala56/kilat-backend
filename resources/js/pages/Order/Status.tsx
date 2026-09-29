import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle2, Clock, Utensils, ArrowLeft, RefreshCw, 
    ShoppingBag, Phone, MapPin, Receipt, AlertCircle, ChefHat, Plus
} from 'lucide-react';

export default function OrderStatus({ tenant, transaction }: any) {
    const isPaid = transaction.payment_status === 'PAID' || transaction.status === 'completed';
    
    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const refreshPage = () => {
        router.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between p-4 font-sans antialiased">
            <Head title={`Status Pesanan - ${transaction.receipt_number}`} />

            <div className="max-w-lg mx-auto w-full space-y-4 py-4">
                
                {/* Header Outlet */}
                <div className="text-center space-y-1">
                    <h1 className="text-xl font-extrabold text-[#FEB400]">{tenant.business_name}</h1>
                    <p className="text-xs text-muted-foreground">{tenant.business_address || 'Struk Digital Pesan Online'}</p>
                </div>

                {/* Status Hero Card */}
                <Card className={`border shadow-sm rounded-2xl overflow-hidden ${
                    isPaid ? 'border-emerald-200 bg-emerald-500/5' : 'border-amber-200 bg-amber-500/5'
                }`}>
                    <CardContent className="p-6 text-center space-y-3">
                        <div className="flex justify-center">
                            {isPaid ? (
                                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <ChefHat className="h-10 w-10 animate-bounce" />
                                </div>
                            ) : (
                                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <Clock className="h-10 w-10 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div>
                            <Badge className={`text-xs px-3 py-1 font-bold ${
                                isPaid 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-amber-500 text-black'
                            }`}>
                                {isPaid ? 'LUNAS — SEDANG DISIAPKAN' : 'MENUNGGU PEMBAYARAN KASIR'}
                            </Badge>
                            
                            <h2 className="text-lg font-bold mt-2 text-foreground">
                                {isPaid ? 'Pesanan Terkirim ke Bar / Dapur' : 'Pesanan Berhasil Dicatat!'}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {isPaid 
                                    ? 'Pembayaran online Anda telah diterima. Barista & koki kami sedang menyiapkan hidangan Anda.'
                                    : `Silakan menuju ke meja kasir atau sebutkan nama "${transaction.customer_name}" di ${transaction.table_number || 'meja'} untuk menyelesaikan pembayaran.`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Struk Rincian Pesanan */}
                <Card className="border shadow-sm bg-background rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/20 pb-3 border-b">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Receipt className="h-4 w-4 text-[#FEB400]" /> Rincian Struk Pesanan
                            </span>
                            <span className="font-mono text-xs">{transaction.receipt_number}</span>
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-4 space-y-4 text-xs">
                        {/* Identitas Pemesan */}
                        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-xl">
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Nama Pemesan:</span>
                                <span className="font-semibold text-foreground">{transaction.customer_name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Nomor HP/WA:</span>
                                <span className="font-semibold text-foreground">{transaction.customer_phone || '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Lokasi / Meja:</span>
                                <span className="font-bold text-[#FEB400]">{transaction.table_number || 'Takeaway'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Metode Bayar:</span>
                                <span className="font-semibold uppercase text-foreground">{transaction.payment_method}</span>
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="space-y-3">
                            <div className="font-semibold text-muted-foreground border-b pb-1">Menu yang Dipesan:</div>
                            {transaction.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-start gap-2">
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            {item.product_name} <span className="text-muted-foreground font-normal">x{item.quantity}</span>
                                        </div>
                                        {item.notes && (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                                Catatan: "{item.notes}"
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-semibold text-foreground shrink-0">
                                        {formatRupiah(item.subtotal)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-3 space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal:</span>
                                <span>{formatRupiah(transaction.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t">
                                <span>Total Tagihan:</span>
                                <span className="text-[#FEB400]">{formatRupiah(transaction.total_amount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                    <Button 
                        variant="outline" 
                        onClick={refreshPage}
                        className="w-full h-10 rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Perbarui Status Pesanan
                    </Button>

                    <Link 
                        href={`/order/${tenant.store_id}${transaction.table_number ? `?table=${encodeURIComponent(transaction.table_number)}` : ''}`}
                        className="block w-full"
                    >
                        <Button 
                            className="w-full bg-[#FEB400] text-black font-bold hover:bg-[#e0a000] h-11 rounded-xl shadow-xs text-xs flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Pesan Menu Lainnya
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
