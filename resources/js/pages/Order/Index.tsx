import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    Utensils, ShoppingBag, Plus, Minus, Search, Clock, Flame, 
    Star, CheckCircle2, ChevronRight, QrCode, Phone, User, 
    Layers, ArrowLeft, X, Sparkles, MapPin, AlertCircle, CreditCard, Banknote
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
    product_id: number;
    product_name: string;
    variant_id: number | null;
    variant_name: string;
    unit_price: number;
    quantity: number;
    notes: string;
    image_url?: string | null;
}

export default function OrderIndex({ tenant, categories, products, tables, initialTable }: any) {
    // Identity State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
    const [tableNumber, setTableNumber] = useState(initialTable || '');
    const [isTableLocked, setIsTableLocked] = useState(Boolean(initialTable));

    // Catalog & Filter State
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Active Item for Variant Modal
    const [activeProduct, setActiveProduct] = useState<any | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemNotes, setItemNotes] = useState('');

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'GATEWAY_QRIS' | 'CASHIER'>('GATEWAY_QRIS');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter products
    const filteredProducts = products.filter((prod: any) => {
        const matchCategory = selectedCategory === 'all' || prod.category_id?.toString() === selectedCategory;
        const matchSearch = !searchQuery || 
            prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCategory && matchSearch;
    });

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    // Open Variant Modal
    const handleOpenVariantModal = (prod: any) => {
        setActiveProduct(prod);
        setItemQty(1);
        setItemNotes('');
        if (prod.has_variants && prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
        } else {
            setSelectedVariant(null);
        }
    };

    // Add to Cart
    const handleAddToCart = () => {
        if (!activeProduct) return;

        const extraPrice = selectedVariant ? Number(selectedVariant.additional_price || 0) : 0;
        const finalUnitPrice = Number(activeProduct.price || 0) + extraPrice;
        const variantName = selectedVariant ? selectedVariant.name : '';

        // Check if item already exists with exact same variant & notes
        const existingIndex = cart.findIndex(
            (c) => c.product_id === activeProduct.id && 
                   c.variant_id === (selectedVariant?.id || null) && 
                   c.notes === itemNotes
        );

        if (existingIndex > -1) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += itemQty;
            setCart(newCart);
        } else {
            setCart([
                ...cart,
                {
                    product_id: activeProduct.id,
                    product_name: activeProduct.name,
                    variant_id: selectedVariant ? selectedVariant.id : null,
                    variant_name: variantName,
                    unit_price: finalUnitPrice,
                    quantity: itemQty,
                    notes: itemNotes,
                    image_url: activeProduct.image_url || (activeProduct.image ? `/storage/${activeProduct.image}` : null),
                }
            ]);
        }

        toast.success(`${activeProduct.name} ditambahkan ke keranjang!`);
        setActiveProduct(null);
    };

    const updateCartQty = (index: number, delta: number) => {
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
            newCart.splice(index, 1);
        }
        setCart(newCart);
    };

    const cartTotalAmount = cart.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
    const cartTotalQty = cart.reduce((acc, it) => acc + it.quantity, 0);

    // Submit Checkout
    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName.trim()) {
            toast.error('Mohon isi nama pemesan terlebih dahulu.');
            return;
        }
        if (!customerPhone.trim()) {
            toast.error('Mohon isi nomor HP / WhatsApp pemesan.');
            return;
        }
        if (orderType === 'DINE_IN' && !tableNumber.trim()) {
            toast.error('Mohon tentukan nomor meja tempat Anda duduk.');
            return;
        }
        if (cart.length === 0) {
            toast.error('Keranjang pesanan masih kosong.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            customer_name: customerName,
            customer_phone: customerPhone,
            order_type: orderType,
            table_number: orderType === 'DINE_IN' ? tableNumber : 'Takeaway',
            payment_method: paymentMethod,
            items: cart.map(it => ({
                product_id: it.product_id,
                variant_id: it.variant_id,
                quantity: it.quantity,
                notes: it.notes,
            })),
        };

        router.post(`/order/${tenant.store_id}/checkout`, payload, {
            onSuccess: () => {
                setIsCartOpen(false);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                const first = Object.values(errors)[0] as string;
                toast.error(first || 'Gagal mengirim pesanan');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between pb-24 font-sans antialiased">
            <Head title={`Pesan Online - ${tenant.business_name}`} />

            {/* Top Bar / Header */}
            <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b shadow-2xs">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-[#FEB400] leading-tight">{tenant.business_name}</h1>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40">
                                Buka
                            </Badge>
                        </div>
                        {tenant.business_address && (
                            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" /> {tenant.business_address}
                            </p>
                        )}
                    </div>
                    {tableNumber && (
                        <div className="text-right">
                            <Badge className="bg-[#FEB400] text-black font-semibold text-xs px-2.5 py-1">
                                {tableNumber}
                            </Badge>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-4">
                
                {/* 1. Identity Box (Customer Info Card) */}
                <Card className="border shadow-2xs bg-background overflow-hidden rounded-2xl">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-[#FEB400]" /> Data Pemesan
                            </span>
                            <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setOrderType('DINE_IN')}
                                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                        orderType === 'DINE_IN' 
                                            ? 'bg-background text-foreground shadow-2xs' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Dine In (Makan Sini)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderType('TAKEAWAY')}
                                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                                        orderType === 'TAKEAWAY' 
                                            ? 'bg-background text-foreground shadow-2xs' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Bungkus (Takeaway)
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Nama Anda <span className="text-red-500">*</span></Label>
                                <Input 
                                    placeholder="Contoh: Budi Santoso"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs">Nomor WhatsApp / HP <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="tel"
                                    placeholder="Contoh: 081234567890"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>

                            {orderType === 'DINE_IN' && (
                                <div className="space-y-1 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Nomor Meja <span className="text-red-500">*</span></Label>
                                        {isTableLocked && (
                                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Terkunci otomatis dari QR Meja
                                            </span>
                                        )}
                                    </div>
                                    {isTableLocked ? (
                                        <Input 
                                            value={tableNumber}
                                            disabled
                                            className="h-9 text-xs bg-muted/60 font-semibold"
                                        />
                                    ) : (
                                        <div className="flex gap-2">
                                            {tables.length > 0 ? (
                                                <select
                                                    value={tableNumber}
                                                    onChange={(e) => setTableNumber(e.target.value)}
                                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="">-- Pilih Nomor Meja Anda --</option>
                                                    {tables.map((t: any) => (
                                                        <option key={t.id} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input 
                                                    placeholder="Contoh: Meja 05"
                                                    value={tableNumber}
                                                    onChange={(e) => setTableNumber(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Search & Category Filters */}
                <div className="space-y-2 sticky top-[57px] z-20 bg-slate-50 dark:bg-zinc-950 pt-2 pb-1">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search"
                            placeholder="Cari makanan, kopi, minuman..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 text-xs bg-background rounded-xl border shadow-2xs"
                        />
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                selectedCategory === 'all'
                                    ? 'bg-[#FEB400] text-black font-semibold shadow-2xs'
                                    : 'bg-background border text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semua Menu
                        </button>
                        {categories.map((c: any) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedCategory(c.id.toString())}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                                    selectedCategory === c.id.toString()
                                        ? 'bg-[#FEB400] text-black font-semibold shadow-2xs'
                                        : 'bg-background border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Product Cards Grid / List */}
                <div className="space-y-3">
                    {filteredProducts.map((prod: any) => {
                        const imgUrl = prod.image_url || (prod.image ? `/storage/${prod.image}` : null);
                        const hasVars = prod.has_variants && prod.variants && prod.variants.length > 0;
                        const tags = Array.isArray(prod.tags) ? prod.tags : [];

                        return (
                            <Card 
                                key={prod.id} 
                                className="border shadow-2xs bg-background rounded-2xl overflow-hidden hover:border-[#FEB400]/50 transition-colors"
                            >
                                <div className="p-3.5 flex gap-3.5 items-center">
                                    {/* Thumbnail Image */}
                                    <div 
                                        onClick={() => handleOpenVariantModal(prod)}
                                        className="w-24 h-24 rounded-xl bg-muted/40 border shrink-0 overflow-hidden relative flex items-center justify-center cursor-pointer"
                                    >
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Utensils className="h-8 w-8 text-muted-foreground/40" />
                                        )}
                                        {prod.is_best_seller && (
                                            <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-2xs">
                                                <Star className="h-2.5 w-2.5 fill-white" /> Top
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <div>
                                                <h3 
                                                    onClick={() => handleOpenVariantModal(prod)}
                                                    className="font-bold text-sm text-foreground hover:text-[#FEB400] cursor-pointer line-clamp-1"
                                                >
                                                    {prod.name}
                                                </h3>
                                                {prod.category && (
                                                    <span className="text-[10px] text-muted-foreground font-medium block">
                                                        {prod.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {prod.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
                                                {prod.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-1.5">
                                            {prod.prep_time_minutes && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                    <Clock className="h-2.5 w-2.5" /> {prod.prep_time_minutes} mnt
                                                </span>
                                            )}
                                            {tags.slice(0, 2).map((t: string) => (
                                                <span key={t} className="text-[9px] bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between mt-2 pt-1">
                                            <div>
                                                <span className="text-xs font-bold text-[#FEB400]">
                                                    {hasVars ? `Mulai ${formatRupiah(prod.price)}` : formatRupiah(prod.price)}
                                                </span>
                                            </div>

                                            <Button 
                                                size="sm"
                                                onClick={() => handleOpenVariantModal(prod)}
                                                className="h-7 px-3 bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000] text-xs rounded-lg shadow-2xs"
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12 bg-background rounded-2xl border p-6 space-y-2">
                            <Utensils className="h-10 w-10 mx-auto text-muted-foreground/40" />
                            <p className="text-sm font-semibold">Menu tidak ditemukan</p>
                            <p className="text-xs text-muted-foreground">Coba kata kunci pencarian atau kategori lain.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* 4. Modal Pemilih Varian & Catatan Khusus */}
            {activeProduct && (
                <Dialog open={Boolean(activeProduct)} onOpenChange={(open) => !open && setActiveProduct(null)}>
                    <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
                        {/* Header Photo */}
                        <div className="relative h-44 bg-muted flex items-center justify-center overflow-hidden">
                            {activeProduct.image_url || activeProduct.image ? (
                                <img 
                                    src={activeProduct.image_url || `/storage/${activeProduct.image}`} 
                                    alt={activeProduct.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Utensils className="h-12 w-12 text-muted-foreground/30" />
                            )}
                            <button 
                                onClick={() => setActiveProduct(null)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{activeProduct.name}</h3>
                                {activeProduct.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activeProduct.description}</p>
                                )}
                            </div>

                            {/* Pilihan Varian (Size/Suhu/dll) */}
                            {activeProduct.has_variants && activeProduct.variants && activeProduct.variants.length > 0 && (
                                <div className="space-y-2 border-t pt-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                                        Pilih Varian / Opsi:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeProduct.variants.map((v: any) => {
                                            const isSelected = selectedVariant?.id === v.id;
                                            return (
                                                <div 
                                                    key={v.id}
                                                    onClick={() => setSelectedVariant(v)}
                                                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                                        isSelected 
                                                            ? 'border-[#FEB400] bg-[#FEB400]/10 font-semibold text-foreground shadow-2xs' 
                                                            : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{v.name}</span>
                                                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#FEB400]" />}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                                        {Number(v.additional_price) > 0 ? `+${formatRupiah(v.additional_price)}` : 'Harga Standar'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Catatan Khusus */}
                            <div className="space-y-1.5 border-t pt-3">
                                <Label className="text-xs">Catatan Khusus untuk Dapur</Label>
                                <Input 
                                    placeholder="Contoh: Es sedikit, gula cair pisah, jangan pakai pedas"
                                    value={itemNotes}
                                    onChange={(e) => setItemNotes(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>

                            {/* Stepper Jumlah */}
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="text-xs font-semibold text-muted-foreground">Jumlah Pesanan</span>
                                <div className="flex items-center gap-3 bg-muted p-1 rounded-xl">
                                    <button 
                                        type="button" 
                                        onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                                        className="p-1 rounded-lg bg-background hover:bg-muted-foreground/10 text-foreground"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="font-bold text-sm w-5 text-center">{itemQty}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setItemQty(itemQty + 1)}
                                        className="p-1 rounded-lg bg-background hover:bg-muted-foreground/10 text-foreground"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Total Item</span>
                                <span className="text-base font-bold text-[#FEB400]">
                                    {formatRupiah(
                                        (Number(activeProduct.price || 0) + Number(selectedVariant?.additional_price || 0)) * itemQty
                                    )}
                                </span>
                            </div>
                            <Button 
                                onClick={handleAddToCart}
                                className="bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000] px-5"
                            >
                                <Plus className="h-4 w-4 mr-1.5" /> Masukkan Keranjang
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* 5. Sticky Bottom Bar for Cart */}
            {cart.length > 0 && !isCartOpen && (
                <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/90 backdrop-blur-md border-t shadow-lg">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                        <div>
                            <span className="text-xs text-muted-foreground block">{cartTotalQty} Menu Dipilih</span>
                            <span className="text-base font-bold text-[#FEB400]">{formatRupiah(cartTotalAmount)}</span>
                        </div>
                        <Button 
                            onClick={() => setIsCartOpen(true)}
                            className="bg-[#FEB400] text-black font-bold hover:bg-[#e0a000] px-6 py-2 rounded-xl shadow-md flex items-center gap-2"
                        >
                            <ShoppingBag className="h-4 w-4" /> Lihat Pesanan
                        </Button>
                    </div>
                </div>
            )}

            {/* 6. Checkout / Cart Drawer Dialog */}
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-4 pb-2 border-b bg-muted/20">
                        <DialogTitle className="text-base flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#FEB400]" /> Konfirmasi Pesanan Anda
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCheckout} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                        {/* Summary Info */}
                        <div className="bg-muted/40 p-3 rounded-xl space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pemesan:</span>
                                <span className="font-semibold">{customerName || '-'} ({customerPhone || '-'})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tipe / Lokasi:</span>
                                <span className="font-semibold text-emerald-600">
                                    {orderType === 'DINE_IN' ? `Makan di Tempat (${tableNumber || 'Meja Belum Dipilih'})` : 'Bungkus / Takeaway'}
                                </span>
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rincian Menu</h4>
                            {cart.map((item, idx) => (
                                <div key={idx} className="p-2.5 rounded-xl border bg-background flex items-center justify-between gap-2 shadow-2xs">
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-bold text-foreground line-clamp-1">{item.product_name}</h5>
                                        {item.variant_name && (
                                            <span className="text-[10px] text-muted-foreground block">{item.variant_name}</span>
                                        )}
                                        {item.notes && (
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5">"{item.notes}"</p>
                                        )}
                                        <span className="text-xs font-semibold text-[#FEB400] mt-1 block">
                                            {formatRupiah(item.unit_price * item.quantity)}
                                        </span>
                                    </div>

                                    {/* Stepper */}
                                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg shrink-0">
                                        <button 
                                            type="button" 
                                            onClick={() => updateCartQty(idx, -1)}
                                            className="p-1 rounded bg-background text-foreground"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => updateCartQty(idx, 1)}
                                            className="p-1 rounded bg-background text-foreground"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pilihan Metode Pembayaran */}
                        <div className="space-y-2 border-t pt-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metode Pembayaran</h4>
                            
                            <div className="grid grid-cols-1 gap-2">
                                {/* Option 1: QRIS / Gateway */}
                                <div 
                                    onClick={() => setPaymentMethod('GATEWAY_QRIS')}
                                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                                        paymentMethod === 'GATEWAY_QRIS'
                                            ? 'border-[#FEB400] bg-[#FEB400]/10 shadow-2xs'
                                            : 'border-border bg-background hover:bg-muted/40'
                                    }`}
                                >
                                    <div className="p-2 rounded-lg bg-[#FEB400]/20 text-[#FEB400] shrink-0 mt-0.5">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">Bayar Online (QRIS / e-Wallet)</span>
                                            {paymentMethod === 'GATEWAY_QRIS' && <CheckCircle2 className="h-4 w-4 text-[#FEB400]" />}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Langsung lunas. Pesanan otomatis dicetak di bar/dapur & segera disiapkan.
                                        </p>
                                    </div>
                                </div>

                                {/* Option 2: Cashier / Pending */}
                                <div 
                                    onClick={() => setPaymentMethod('CASHIER')}
                                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                                        paymentMethod === 'CASHIER'
                                            ? 'border-[#FEB400] bg-[#FEB400]/10 shadow-2xs'
                                            : 'border-border bg-background hover:bg-muted/40'
                                    }`}
                                >
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 shrink-0 mt-0.5">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-foreground">Bayar di Kasir (Cash / Meja)</span>
                                            {paymentMethod === 'CASHIER' && <CheckCircle2 className="h-4 w-4 text-[#FEB400]" />}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Pesan sekarang, lakukan pembayaran tunai/kartu ke kasir setelah pesanan dibuat.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Calculation */}
                        <div className="border-t pt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal Pesanan:</span>
                                <span>{formatRupiah(cartTotalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t">
                                <span>Total Tagihan:</span>
                                <span className="text-[#FEB400]">{formatRupiah(cartTotalAmount)}</span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-[#FEB400] text-black font-bold hover:bg-[#e0a000] h-11 rounded-xl shadow-md text-sm"
                        >
                            {isSubmitting ? 'Memproses Pesanan...' : 'Kirim Pesanan Sekarang'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}
