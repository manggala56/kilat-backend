import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Plus, Edit2, Trash2, Package, Search, ChevronDown, ChevronRight, 
    Layers, Sparkles, Tag, AlertCircle, Wand2, X, Eye, Globe, Star, 
    Clock, Flame, CheckCircle2, Utensils, ShoppingBag, UploadCloud, ImageIcon,
    Calculator, BookOpen, Percent, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';

interface VariantForm {
    id?: number;
    name: string;
    sku: string;
    additional_price: string | number;
    stock: string | number;
}

interface ProductForm {
    name: string;
    category_id: string;
    sku: string;
    cost_price: string;
    recipe_hpp?: number;
    price: string;
    stock: string;
    margin_percentage: string;
    low_stock_threshold: string;
    description: string;
    has_variants: boolean;
    is_available_online: boolean;
    is_best_seller: boolean;
    prep_time_minutes: string | number;
    calories: string;
    tags: string[];
    image: File | null;
    image_preview: string | null;
    variants: VariantForm[];
}

const DIETARY_TAG_OPTIONS = [
    'Halal',
    'Signature',
    'Pedas',
    'Vegetarian',
    'Dairy Free',
    'Gluten Free',
    'Low Calorie',
];

const emptyForm: ProductForm = {
    name: '',
    category_id: '',
    sku: '',
    cost_price: '',
    recipe_hpp: 0,
    price: '',
    stock: '0',
    margin_percentage: '',
    low_stock_threshold: '5',
    description: '',
    has_variants: false,
    is_available_online: true,
    is_best_seller: false,
    prep_time_minutes: '10',
    calories: '',
    tags: ['Halal'],
    image: null,
    image_preview: null,
    variants: [],
};

export default function ProductsIndex({ products, categories, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for Preview Modal (Customer Online Ordering Mockup)
    const [previewProduct, setPreviewProduct] = useState<any | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search || categoryId !== filters?.category_id) {
                router.get('/owner/products', { search, category_id: categoryId }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search, categoryId]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Katalog & Pesan Online', href: '/owner/products' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/owner/products', { search, category_id: categoryId }, { preserveState: true });
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                toast.error('Ukuran foto maksimal 3 MB');
                return;
            }
            setForm(prev => ({
                ...prev,
                image: file,
                image_preview: URL.createObjectURL(file),
            }));
            toast.success('Foto produk dipilih!');
        }
    };

    const removePhoto = () => {
        setForm(prev => ({
            ...prev,
            image: null,
            image_preview: null,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Auto-generate SKU for Product
    const generateProductSku = () => {
        const catName = categories.find((c: any) => c.id.toString() === form.category_id)?.name || 'PRD';
        const catPrefix = catName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
        const namePrefix = form.name ? form.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'ITEM';
        const rand = Math.floor(100 + Math.random() * 900);
        const newSku = `${catPrefix}-${namePrefix}-${rand}`;
        
        setForm(prev => {
            const updatedVariants = prev.variants.map(v => ({
                ...v,
                sku: v.sku && !v.sku.startsWith('SKU-') ? v.sku : `${newSku}-${v.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
            }));
            return {
                ...prev,
                sku: newSku,
                variants: updatedVariants
            };
        });
        toast.info(`SKU di-generate: ${newSku}`);
    };

    // FnB Preset generator
    const applyFnbPreset = (type: 'size' | 'temp' | 'sugar' | 'topping') => {
        const baseSku = form.sku || 'PRD-01';
        let newVariants: VariantForm[] = [];

        if (type === 'size') {
            newVariants = [
                { name: 'Regular', sku: `${baseSku}-REG`, additional_price: '0', stock: '50' },
                { name: 'Large', sku: `${baseSku}-LRG`, additional_price: '5000', stock: '50' },
            ];
        } else if (type === 'temp') {
            newVariants = [
                { name: 'Hot (Panas)', sku: `${baseSku}-HOT`, additional_price: '0', stock: '50' },
                { name: 'Ice (Dingin)', sku: `${baseSku}-ICE`, additional_price: '2000', stock: '50' },
            ];
        } else if (type === 'sugar') {
            newVariants = [
                { name: 'Normal Sugar (100%)', sku: `${baseSku}-SUG100`, additional_price: '0', stock: '100' },
                { name: 'Less Sugar (50%)', sku: `${baseSku}-SUG50`, additional_price: '0', stock: '100' },
                { name: 'No Sugar (0%)', sku: `${baseSku}-NOSUG`, additional_price: '0', stock: '100' },
            ];
        } else if (type === 'topping') {
            newVariants = [
                { name: 'Extra Shot Espresso', sku: `${baseSku}-XSHOT`, additional_price: '5000', stock: '100' },
                { name: 'Boba / Tapioca', sku: `${baseSku}-BOBA`, additional_price: '4000', stock: '100' },
                { name: 'Cheese Foam', sku: `${baseSku}-CF`, additional_price: '6000', stock: '100' },
            ];
        }

        setForm(prev => ({
            ...prev,
            has_variants: true,
            variants: [...prev.variants, ...newVariants]
        }));
        toast.success(`Preset varian F&B (${type}) berhasil ditambahkan!`);
    };

    const addManualVariant = () => {
        const baseSku = form.sku || 'PRD';
        const num = form.variants.length + 1;
        setForm(prev => ({
            ...prev,
            has_variants: true,
            variants: [
                ...prev.variants,
                { name: `Varian ${num}`, sku: `${baseSku}-VAR${num}`, additional_price: '0', stock: '50' }
            ]
        }));
    };

    const updateVariant = (index: number, field: keyof VariantForm, value: any) => {
        setForm(prev => {
            const updated = [...prev.variants];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, variants: updated };
        });
    };

    const removeVariant = (index: number) => {
        setForm(prev => {
            const updated = prev.variants.filter((_, i) => i !== index);
            return {
                ...prev,
                variants: updated,
                has_variants: updated.length > 0
            };
        });
    };

    const toggleTag = (tag: string) => {
        setForm(prev => {
            const exists = prev.tags.includes(tag);
            return {
                ...prev,
                tags: exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
            };
        });
    };

    const handleHppChange = (val: string) => {
        const hppNum = parseFloat(val) || 0;
        const marginNum = parseFloat(form.margin_percentage) || 0;
        
        let newPrice = form.price;
        if (marginNum > 0 && hppNum > 0) {
            const rawPrice = hppNum + (hppNum * (marginNum / 100));
            newPrice = Math.round(rawPrice).toString();
        }
        
        setForm(prev => ({
            ...prev,
            cost_price: val,
            price: newPrice,
        }));
    };

    const handleMarginChange = (val: string) => {
        const marginNum = parseFloat(val) || 0;
        const hppNum = parseFloat(form.cost_price) || 0;
        
        let newPrice = form.price;
        if (marginNum > 0 && hppNum > 0) {
            const rawPrice = hppNum + (hppNum * (marginNum / 100));
            newPrice = Math.round(rawPrice).toString();
        }
        
        setForm(prev => ({
            ...prev,
            margin_percentage: val,
            price: newPrice,
        }));
    };

    const applyPresetMargin = (pct: number) => {
        handleMarginChange(pct.toString());
    };

    const useRecipeHpp = () => {
        if (form.recipe_hpp && form.recipe_hpp > 0) {
            handleHppChange(form.recipe_hpp.toString());
            toast.success(`HPP dari Buku Resep (${formatRupiah(form.recipe_hpp)}) berhasil diterapkan!`);
        }
    };

    const applyRounding = (roundUnit: number) => {
        const currentPrice = parseFloat(form.price) || 0;
        if (currentPrice <= 0) return;
        
        let roundedPrice = currentPrice;
        if (roundUnit === 100) {
            roundedPrice = Math.ceil(currentPrice / 100) * 100;
        } else if (roundUnit === 500) {
            roundedPrice = Math.ceil(currentPrice / 500) * 500;
        } else if (roundUnit === 1000) {
            roundedPrice = Math.ceil(currentPrice / 1000) * 1000;
        }

        setForm(prev => ({
            ...prev,
            price: roundedPrice.toString(),
        }));
        toast.info(`Harga dibulatkan ke ${formatRupiah(roundedPrice)}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            name: form.name,
            category_id: form.category_id,
            sku: form.sku,
            cost_price: form.cost_price,
            price: form.price,
            stock: form.stock,
            margin_percentage: form.margin_percentage,
            low_stock_threshold: form.low_stock_threshold,
            description: form.description,
            has_variants: form.has_variants ? 1 : 0,
            is_available_online: form.is_available_online ? 1 : 0,
            is_best_seller: form.is_best_seller ? 1 : 0,
            prep_time_minutes: form.prep_time_minutes,
            calories: form.calories,
            tags: form.tags,
            variants: form.variants,
        };

        if (form.image) {
            payload.image = form.image;
        }

        if (form.has_variants && form.variants.length > 0) {
            const totalStock = form.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
            payload.stock = totalStock;
        }

        if (isEdit) {
            payload._method = 'put';
            router.post(`/owner/products/${currentId}`, payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    toast.success('Produk & Foto berhasil diperbarui');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menyimpan produk');
                }
            });
        } else {
            router.post('/owner/products', payload, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    setForm(emptyForm);
                    toast.success('Produk baru & Foto berhasil ditambahkan');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0] as string;
                    toast.error(firstError || 'Gagal menambahkan produk');
                }
            });
        }
    };

    const handleEdit = (prod: any) => {
        setIsEdit(true);
        setCurrentId(prod.id);
        
        const mappedVariants: VariantForm[] = (prod.variants || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku || '',
            additional_price: v.additional_price?.toString() || '0',
            stock: v.stock?.toString() || '0',
        }));

        const recipeHpp = Number(prod.recipe_hpp) || (Array.isArray(prod.recipe_items) ? prod.recipe_items.reduce((acc: number, item: any) => acc + ((Number(item.quantity) || 0) * (Number(item.raw_material?.cost_per_unit) || 0)), 0) : 0);

        setForm({ 
            name: prod.name, 
            category_id: prod.category_id?.toString() || '', 
            sku: prod.sku || '', 
            cost_price: prod.cost_price ? prod.cost_price.toString() : (recipeHpp > 0 ? recipeHpp.toString() : ''),
            recipe_hpp: recipeHpp,
            price: prod.price?.toString() || '', 
            stock: prod.stock?.toString() || '0',
            margin_percentage: prod.margin_percentage?.toString() || '',
            low_stock_threshold: prod.low_stock_threshold?.toString() || '5',
            description: prod.description || '',
            has_variants: Boolean(prod.has_variants && mappedVariants.length > 0),
            is_available_online: prod.is_available_online !== undefined ? Boolean(prod.is_available_online) : true,
            is_best_seller: Boolean(prod.is_best_seller),
            prep_time_minutes: prod.prep_time_minutes || '10',
            calories: prod.calories || '',
            tags: Array.isArray(prod.tags) ? prod.tags : ['Halal'],
            image: null,
            image_preview: prod.image_url || (prod.image ? `/storage/${prod.image}` : null),
            variants: mappedVariants,
        });
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menonaktifkan produk ini beserta variannya?')) {
            router.delete(`/owner/products/${id}`, {
                onSuccess: () => toast.success('Produk berhasil dinonaktifkan')
            });
        }
    };

    const openPreview = (prod: any) => {
        setPreviewProduct(prod);
        setSelectedVariantId(prod.variants && prod.variants.length > 0 ? prod.variants[0].id : null);
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Produk, SKU Varian & Pesan Online" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Katalog Produk & Menu Online</h2>
                            <Badge variant="outline" className="border-[#FEB400] text-[#FEB400] bg-[#FEB400]/10 text-xs font-semibold">
                                Ready for Online Order
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Kelola foto menu, rincian produk, deskripsi digital, opsi SKU varian, dan ketersediaan pesan online.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="search" 
                                    placeholder="Cari produk / SKU..." 
                                    className="pl-8 w-[200px]" 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                />
                            </div>
                        </form>

                        {/* Modal Tambah / Edit Produk */}
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    onClick={() => { 
                                        setIsEdit(false); 
                                        setForm(emptyForm); 
                                    }} 
                                    className="bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000] w-full sm:w-auto shadow-xs"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl xl:max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto p-6 md:p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                                        {isEdit ? <Edit2 className="h-5 w-5 text-[#FEB400]" /> : <Plus className="h-5 w-5 text-[#FEB400]" />}
                                        {isEdit ? 'Edit Produk & Menu Online' : 'Tambah Produk Baru (F&B & Online Order)'}
                                    </DialogTitle>
                                </DialogHeader>

                                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                                    
                                    {/* Section 1: Upload Foto Produk */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <ImageIcon className="h-4 w-4 text-[#FEB400]" /> 1. Foto Produk / Menu
                                        </h4>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-xl bg-muted/20">
                                            {/* Preview Box */}
                                            <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-background flex items-center justify-center overflow-hidden shrink-0">
                                                {form.image_preview ? (
                                                    <>
                                                        <img 
                                                            src={form.image_preview} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={removePhoto}
                                                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-xs"
                                                            title="Hapus foto"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                                                        <Utensils className="h-8 w-8 mb-1 text-muted-foreground/40" />
                                                        <span className="text-[10px]">Belum ada foto</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Upload */}
                                            <div className="space-y-2 flex-1 text-center sm:text-left">
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    accept="image/png, image/jpeg, image/webp" 
                                                    className="hidden" 
                                                    onChange={handleFileChange}
                                                />
                                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-xs font-medium"
                                                    >
                                                        <UploadCloud className="h-4 w-4 mr-1.5 text-[#FEB400]" /> 
                                                        {form.image_preview ? 'Ganti Foto Produk' : 'Pilih Foto dari Perangkat'}
                                                    </Button>
                                                    {form.image_preview && (
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={removePhoto}
                                                            className="text-xs text-red-500 hover:text-red-700"
                                                        >
                                                            Hapus
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Format: JPG, PNG, WEBP (Maksimal 3MB). Foto yang menarik meningkatkan konversi pesanan online hingga 40%.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Informasi Pokok */}
                                    <div className="border-t pt-4 space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Utensils className="h-4 w-4 text-[#FEB400]" /> 2. Informasi Produk & Harga
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label>Nama Produk / Menu <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    required 
                                                    placeholder="Contoh: Kopi Susu Aren Signature, Chicken Katsu Curry" 
                                                    value={form.name} 
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Kategori</Label>
                                                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c: any) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>SKU Induk (Parent)</Label>
                                                    <button 
                                                        type="button" 
                                                        onClick={generateProductSku}
                                                        className="text-xs text-[#FEB400] hover:underline flex items-center gap-1 font-medium"
                                                    >
                                                        <Wand2 className="h-3 w-3" /> Auto SKU
                                                    </button>
                                                </div>
                                                <Input 
                                                    placeholder="Contoh: BEV-KOPSUS-01" 
                                                    value={form.sku} 
                                                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} 
                                                />
                                            </div>

                                            {/* Smart Pricing & Cost Calculator Box */}
                                            <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 via-primary/5 to-muted/30 border border-primary/20 space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Calculator className="h-4 w-4 text-[#FEB400]" />
                                                        <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                            Kalkulator Harga & Estimasi Profit (HPP & Margin)
                                                        </h5>
                                                    </div>
                                                    {form.recipe_hpp && form.recipe_hpp > 0 ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={useRecipeHpp}
                                                            className="h-7 text-xs bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 gap-1.5"
                                                        >
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            Gunakan HPP Resep: {formatRupiah(form.recipe_hpp)}
                                                        </Button>
                                                    ) : null}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {/* HPP (Modal Pokok) */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold">HPP / Modal (Rp)</Label>
                                                            <span className="text-[10px] text-muted-foreground">(Bisa dikosongi)</span>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            placeholder="Contoh: 10000"
                                                            value={form.cost_price}
                                                            onChange={(e) => handleHppChange(e.target.value)}
                                                            className="h-9 text-sm"
                                                        />
                                                    </div>

                                                    {/* Margin (%) */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-semibold">Target Margin (%)</Label>
                                                            <span className="text-[10px] text-muted-foreground">(Opsional)</span>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Contoh: 30"
                                                            value={form.margin_percentage}
                                                            onChange={(e) => handleMarginChange(e.target.value)}
                                                            className="h-9 text-sm"
                                                        />
                                                        {/* Quick Margin Presets */}
                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                            {[10, 20, 30, 50, 100].map((pct) => (
                                                                <button
                                                                    key={pct}
                                                                    type="button"
                                                                    onClick={() => applyPresetMargin(pct)}
                                                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                                                                        form.margin_percentage === pct.toString()
                                                                            ? 'bg-[#FEB400] text-black font-bold'
                                                                            : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground'
                                                                    }`}
                                                                >
                                                                    +{pct}%
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Harga Jual Dasar [Wajib] */}
                                                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-bold text-primary flex items-center gap-1">
                                                                Harga Jual (Rp) <span className="text-red-500">*</span>
                                                            </Label>
                                                            {/* Live Profit Preview */}
                                                            {parseFloat(form.price) > 0 && parseFloat(form.cost_price) > 0 && (
                                                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    Profit: {formatRupiah(parseFloat(form.price) - parseFloat(form.cost_price))} (
                                                                    {Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.cost_price)) * 100)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            required
                                                            placeholder="Contoh: 18000"
                                                            value={form.price}
                                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                                            className="h-9 text-sm font-bold border-primary/40 focus-visible:ring-primary"
                                                        />

                                                        {/* Smart Rounding / Normalisasi Harga */}
                                                        {parseFloat(form.price) > 0 && (
                                                            <div className="flex items-center gap-1 pt-1 flex-wrap">
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                    <TrendingUp className="h-3 w-3" /> Normalisasi:
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => applyRounding(100)}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground border border-border"
                                                                    title="Bulatkan ke kelipatan 100 ke atas"
                                                                >
                                                                    +100
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => applyRounding(500)}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground border border-border"
                                                                    title="Bulatkan ke kelipatan 500 ke atas"
                                                                >
                                                                    +500
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => applyRounding(1000)}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground border border-border"
                                                                    title="Bulatkan ke kelipatan 1.000 ke atas"
                                                                >
                                                                    +1.000
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {!form.has_variants && (
                                                <div className="space-y-2">
                                                    <Label>Stok Awal</Label>
                                                    <Input 
                                                        type="number" 
                                                        required 
                                                        value={form.stock} 
                                                        onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Batas Minimum Stok (Alert)</Label>
                                                <Input 
                                                    type="number" 
                                                    value={form.low_stock_threshold} 
                                                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Detail Rincian Menu untuk Pesan Online */}
                                    <div className="border-t pt-4 space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            <Globe className="h-4 w-4 text-[#FEB400]" /> 3. Rincian & Pengaturan Pesan Online (Digital Menu)
                                        </h4>
                                        
                                        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border">
                                            {/* Deskripsi Menu */}
                                            <div className="space-y-1.5">
                                                <Label>Deskripsi / Rincian Menu untuk Customer Online</Label>
                                                <textarea 
                                                    rows={3}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    placeholder="Deskripsikan cita rasa, komposisi bahan, dan keunggulan menu ini agar menarik bagi pembeli online..."
                                                    value={form.description}
                                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                />
                                            </div>

                                            {/* Toggle Fitur Online */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="flex items-center gap-3 bg-background p-3 rounded-lg border">
                                                    <input 
                                                        type="checkbox" 
                                                        id="is_available_online"
                                                        checked={form.is_available_online}
                                                        onChange={(e) => setForm({ ...form, is_available_online: e.target.checked })}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#FEB400] focus:ring-[#FEB400]"
                                                    />
                                                    <label htmlFor="is_available_online" className="text-sm font-medium cursor-pointer">
                                                        <span className="block font-semibold">Tersedia untuk Pesan Online</span>
                                                        <span className="text-xs text-muted-foreground">Tampilkan produk ini di menu digital web / QR order</span>
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-3 bg-background p-3 rounded-lg border">
                                                    <input 
                                                        type="checkbox" 
                                                        id="is_best_seller"
                                                        checked={form.is_best_seller}
                                                        onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#FEB400] focus:ring-[#FEB400]"
                                                    />
                                                    <label htmlFor="is_best_seller" className="text-sm font-medium cursor-pointer">
                                                        <span className="block font-semibold flex items-center gap-1">
                                                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Menu Favorit / Best Seller
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">Beri badge rekomendasi teratas untuk pembeli</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Waktu Masak & Kalori */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Estimasi Waktu Masak (Menit)
                                                    </Label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="10" 
                                                        value={form.prep_time_minutes} 
                                                        onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} 
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="flex items-center gap-1">
                                                        <Flame className="h-3.5 w-3.5 text-muted-foreground" /> Kalori / Info Nutrisi (Opsional)
                                                    </Label>
                                                    <Input 
                                                        placeholder="Contoh: 180 kcal" 
                                                        value={form.calories} 
                                                        onChange={(e) => setForm({ ...form, calories: e.target.value })} 
                                                    />
                                                </div>
                                            </div>

                                            {/* Tags / Diet & Alergen */}
                                            <div className="space-y-2">
                                                <Label>Label Diet, Alergen & Kategori Khusus</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {DIETARY_TAG_OPTIONS.map(tag => {
                                                        const isSelected = form.tags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={() => toggleTag(tag)}
                                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                                    isSelected 
                                                                        ? 'bg-[#FEB400] text-black font-semibold shadow-xs' 
                                                                        : 'bg-background border text-muted-foreground hover:border-gray-400'
                                                                }`}
                                                            >
                                                                {isSelected && '✓ '} {tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Varian & Modifiers F&B */}
                                    <div className="border-t pt-4 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                    <Layers className="h-4 w-4 text-[#FEB400]" /> 4. SKU Varian & Modifiers (F&B)
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Tambahkan pilihan ukuran, suhu, atau add-on yang bisa dipilih pembeli secara online.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="has_variants_toggle"
                                                    checked={form.has_variants}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setForm(prev => ({
                                                            ...prev,
                                                            has_variants: checked,
                                                            variants: checked && prev.variants.length === 0 
                                                                ? [
                                                                    { name: 'Regular', sku: `${prev.sku || 'PRD'}-REG`, additional_price: '0', stock: '50' },
                                                                    { name: 'Large', sku: `${prev.sku || 'PRD'}-LRG`, additional_price: '5000', stock: '50' }
                                                                  ]
                                                                : prev.variants
                                                        }));
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-[#FEB400] focus:ring-[#FEB400]"
                                                />
                                                <label htmlFor="has_variants_toggle" className="text-sm font-medium cursor-pointer">
                                                    Produk Memiliki Varian
                                                </label>
                                            </div>
                                        </div>

                                        {form.has_variants && (
                                            <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                                                {/* Preset Cepat F&B */}
                                                <div>
                                                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                                                        <Sparkles className="h-3.5 w-3.5 text-[#FEB400]" /> Preset Cepat Varian F&B:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => applyFnbPreset('size')}
                                                            className="text-xs h-7"
                                                        >
                                                            + Ukuran (Reguler / Large)
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => applyFnbPreset('temp')}
                                                            className="text-xs h-7"
                                                        >
                                                            + Suhu (Hot / Ice)
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => applyFnbPreset('sugar')}
                                                            className="text-xs h-7"
                                                        >
                                                            + Level Sugar (100% / 50% / 0%)
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => applyFnbPreset('topping')}
                                                            className="text-xs h-7"
                                                        >
                                                            + Add-on / Topping
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* List of Variants */}
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                                                        <div className="col-span-4">Nama Varian</div>
                                                        <div className="col-span-3">SKU Varian</div>
                                                        <div className="col-span-2 text-right">Tambahan (Rp)</div>
                                                        <div className="col-span-2 text-center">Stok</div>
                                                        <div className="col-span-1 text-center">Aksi</div>
                                                    </div>

                                                    {form.variants.map((variant, index) => (
                                                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-background p-2 rounded-lg border shadow-xs">
                                                            <div className="col-span-4">
                                                                <Input 
                                                                    placeholder="e.g. Ice / Large" 
                                                                    value={variant.name} 
                                                                    onChange={(e) => updateVariant(index, 'name', e.target.value)} 
                                                                    className="h-8 text-xs font-medium"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Input 
                                                                    placeholder="SKU Varian" 
                                                                    value={variant.sku} 
                                                                    onChange={(e) => updateVariant(index, 'sku', e.target.value.toUpperCase())} 
                                                                    className="h-8 text-xs font-mono uppercase"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    value={variant.additional_price} 
                                                                    onChange={(e) => updateVariant(index, 'additional_price', e.target.value)} 
                                                                    className="h-8 text-xs text-right font-medium"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="Stok" 
                                                                    value={variant.stock} 
                                                                    onChange={(e) => updateVariant(index, 'stock', e.target.value)} 
                                                                    className="h-8 text-xs text-center font-medium"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <Button 
                                                                    type="button" 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => removeVariant(index)}
                                                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={addManualVariant}
                                                        className="w-full text-xs border-dashed border-muted-foreground/40 hover:border-[#FEB400] text-muted-foreground hover:text-black"
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Baris Varian Manual
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000] h-10">
                                        {isEdit ? 'Simpan Perubahan Katalog' : 'Tambahkan Produk ke Katalog & Pesan Online'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Main Table */}
                <Card className="mt-2 border shadow-xs">
                    <CardHeader className="bg-muted/20 pb-4 border-b">
                        <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-[#FEB400]" /> 
                                <span>Katalog Produk ({products.total || products.data.length})</span>
                            </div>
                            <span className="text-xs font-normal text-muted-foreground">
                                Klik tombol <Eye className="inline h-3.5 w-3.5 text-blue-500" /> untuk melihat preview tampilan pemesanan online.
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10">
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead>Produk & Foto</TableHead>
                                    <TableHead>SKU Induk</TableHead>
                                    <TableHead>Status Online & Tags</TableHead>
                                    <TableHead className="text-right">Harga Jual Dasar</TableHead>
                                    <TableHead className="text-center">Total Stok</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((prod: any) => {
                                    const hasVars = prod.has_variants && prod.variants && prod.variants.length > 0;
                                    const isExpanded = expandedRows[prod.id];
                                    const tags = Array.isArray(prod.tags) ? prod.tags : [];
                                    const imgUrl = prod.image_url || (prod.image ? `/storage/${prod.image}` : null);

                                    return (
                                        <React.Fragment key={prod.id}>
                                            <TableRow className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20 border-b-0' : ''}`}>
                                                <TableCell className="text-center p-2">
                                                    {hasVars ? (
                                                        <button 
                                                            onClick={() => toggleRow(prod.id)}
                                                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title={isExpanded ? 'Sembunyikan varian' : 'Lihat varian'}
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-[#FEB400]" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted-foreground/40 text-xs">•</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {/* Product Image Thumbnail */}
                                                        <div 
                                                            onClick={() => openPreview(prod)}
                                                            className="w-11 h-11 rounded-lg border bg-muted/30 shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity"
                                                            title="Klik untuk preview menu online"
                                                        >
                                                            {imgUrl ? (
                                                                <img src={imgUrl} alt={prod.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Utensils className="h-5 w-5 text-muted-foreground/40" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <div className="font-semibold text-foreground flex items-center gap-2">
                                                                <span>{prod.name}</span>
                                                                {prod.is_best_seller && (
                                                                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                                                                        <Star className="h-2.5 w-2.5 fill-current" /> Favorit
                                                                    </Badge>
                                                                )}
                                                                {prod.category && (
                                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                                                        {prod.category.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {prod.description ? (
                                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                                    {prod.description}
                                                                </p>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground/60 italic">Belum ada deskripsi rincian online</span>
                                                            )}
                                                            {prod.prep_time_minutes && (
                                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" /> {prod.prep_time_minutes} mnt
                                                                    </span>
                                                                    {prod.calories && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Flame className="h-3 w-3 text-orange-500" /> {prod.calories}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3 text-muted-foreground/60" />
                                                        <span>{prod.sku || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div>
                                                            {prod.is_available_online ? (
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 text-[10px] px-1.5 py-0">
                                                                    <Globe className="h-2.5 w-2.5 mr-1" /> Pesan Online On
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-[10px] text-muted-foreground px-1.5 py-0">
                                                                    Dine-in Only
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {tags.slice(0, 3).map((t: string) => (
                                                                    <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                                                        {t}
                                                                    </span>
                                                                ))}
                                                                {tags.length > 3 && (
                                                                    <span className="text-[9px] text-muted-foreground">+{tags.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    <div>{formatRupiah(prod.price)}</div>
                                                    {(parseFloat(prod.cost_price) > 0 || parseFloat(prod.recipe_hpp) > 0) && (
                                                        <span className="block text-[10px] text-muted-foreground font-normal">
                                                            HPP: {formatRupiah(parseFloat(prod.cost_price) > 0 ? prod.cost_price : prod.recipe_hpp)}
                                                        </span>
                                                    )}
                                                    {prod.margin_percentage && (
                                                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                            Margin: {prod.margin_percentage}%
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {prod.stock <= (prod.low_stock_threshold || 5) ? (
                                                        <Badge variant="destructive" className="text-xs font-medium">
                                                            {prod.stock} unit
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 text-xs">
                                                            {prod.stock} unit
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => openPreview(prod)}
                                                            className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                            title="Preview Tampilan Menu Online"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleEdit(prod)}
                                                            className="h-8 px-2 text-xs"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" 
                                                            onClick={() => handleDelete(prod.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expandable Sub-table for SKU Variants */}
                                            {hasVars && isExpanded && (
                                                <TableRow className="bg-muted/15 border-b">
                                                    <TableCell colSpan={7} className="p-0">
                                                        <div className="py-3 px-8 bg-muted/20 border-y space-y-2">
                                                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Layers className="h-3.5 w-3.5 text-[#FEB400]" /> 
                                                                    Rincian SKU Varian & Opsi (F&B) untuk {prod.name}:
                                                                </span>
                                                                <span>Harga Total = Harga Dasar + Tambahan</span>
                                                            </div>
                                                            <div className="bg-background rounded-lg border shadow-xs overflow-hidden">
                                                                <Table>
                                                                    <TableHeader className="bg-muted/40">
                                                                        <TableRow className="h-8 text-[11px]">
                                                                            <TableHead className="py-1">Nama Varian</TableHead>
                                                                            <TableHead className="py-1">SKU Varian</TableHead>
                                                                            <TableHead className="py-1 text-right">Tambahan Harga</TableHead>
                                                                            <TableHead className="py-1 text-right">Harga Jual Akhir</TableHead>
                                                                            <TableHead className="py-1 text-center">Stok Varian</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {prod.variants.map((v: any) => {
                                                                            const finalPrice = Number(prod.price || 0) + Number(v.additional_price || 0);
                                                                            return (
                                                                                <TableRow key={v.id} className="h-8 text-xs hover:bg-muted/20">
                                                                                    <TableCell className="py-1.5 font-medium">{v.name}</TableCell>
                                                                                    <TableCell className="py-1.5 font-mono text-[11px] text-muted-foreground">
                                                                                        {v.sku || '-'}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1.5 text-right text-muted-foreground">
                                                                                        {Number(v.additional_price) > 0 ? `+${formatRupiah(v.additional_price)}` : 'Rp 0'}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                                                        {formatRupiah(finalPrice)}
                                                                                    </TableCell>
                                                                                    <TableCell className="py-1.5 text-center">
                                                                                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                                                                            {v.stock} unit
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <Package className="h-8 w-8 text-muted-foreground/40" />
                                                <p className="font-medium">Tidak ada produk ditemukan.</p>
                                                <p className="text-xs">Klik "Tambah Produk" untuk mulai mendaftarkan menu & varian F&B Anda.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination links={products.links} />

                {/* Dialog: Preview Menu Pesan Online Customer View */}
                {previewProduct && (
                    <Dialog open={Boolean(previewProduct)} onOpenChange={(open) => !open && setPreviewProduct(null)}>
                        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
                            {/* Card Mockup Online Ordering Header with Photo */}
                            <div className="relative bg-gradient-to-br from-amber-500/10 to-[#FEB400]/20 h-48 flex items-center justify-center border-b overflow-hidden">
                                {previewProduct.image_url || previewProduct.image ? (
                                    <img 
                                        src={previewProduct.image_url || `/storage/${previewProduct.image}`} 
                                        alt={previewProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Utensils className="h-16 w-16 text-[#FEB400]/50" />
                                )}
                                
                                <div className="absolute top-3 left-3 flex gap-1.5">
                                    {previewProduct.is_best_seller && (
                                        <Badge className="bg-amber-500 text-white font-semibold text-xs shadow-xs">
                                            <Star className="h-3 w-3 mr-1 fill-white" /> Best Seller
                                        </Badge>
                                    )}
                                    {previewProduct.category && (
                                        <Badge variant="secondary" className="bg-background/90 text-xs backdrop-blur-xs">
                                            {previewProduct.category.name}
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute top-3 right-3">
                                    {previewProduct.is_available_online ? (
                                        <Badge className="bg-emerald-600 text-white text-xs shadow-xs">
                                            Online Order Ready
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-xs">
                                            Dine-in Only
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <div className="flex items-baseline justify-between gap-2">
                                        <h3 className="text-xl font-bold text-foreground">{previewProduct.name}</h3>
                                        <span className="text-lg font-bold text-[#FEB400]">
                                            {formatRupiah(
                                                Number(previewProduct.price || 0) + 
                                                Number(previewProduct.variants?.find((v: any) => v.id === selectedVariantId)?.additional_price || 0)
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        SKU: {previewProduct.sku || '-'}
                                    </p>
                                </div>

                                {/* Deskripsi Rinci */}
                                <div className="bg-muted/40 p-3 rounded-xl space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Rincian & Komposisi Menu
                                    </h4>
                                    <p className="text-xs leading-relaxed text-foreground">
                                        {previewProduct.description || 'Menu lezat disajikan dengan bahan berkualitas tinggi dan higienis.'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {previewProduct.prep_time_minutes || 10} Menit Penyajian
                                        </span>
                                        {previewProduct.calories && (
                                            <span className="flex items-center gap-1">
                                                <Flame className="h-3.5 w-3.5 text-orange-500" /> {previewProduct.calories}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Dietary Tags */}
                                {Array.isArray(previewProduct.tags) && previewProduct.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {previewProduct.tags.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="text-xs py-0.5 px-2 bg-background">
                                                ✓ {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Pilihan Varian Interaktif */}
                                {previewProduct.variants && previewProduct.variants.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                            Pilih Opsi Varian / Ukuran:
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {previewProduct.variants.map((v: any) => {
                                                const isSelected = selectedVariantId === v.id;
                                                return (
                                                    <div 
                                                        key={v.id}
                                                        onClick={() => setSelectedVariantId(v.id)}
                                                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? 'border-[#FEB400] bg-[#FEB400]/10 font-semibold text-foreground shadow-xs' 
                                                                : 'border-border bg-background hover:bg-muted/40 text-muted-foreground'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span>{v.name}</span>
                                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[#FEB400]" />}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                                            {Number(v.additional_price) > 0 ? `+${formatRupiah(v.additional_price)}` : 'Harga Normal'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Mockup */}
                            <div className="p-4 bg-muted/20 border-t flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] text-muted-foreground block">Simulasi Pesan Online</span>
                                    <span className="text-base font-bold text-foreground">
                                        {formatRupiah(
                                            Number(previewProduct.price || 0) + 
                                            Number(previewProduct.variants?.find((v: any) => v.id === selectedVariantId)?.additional_price || 0)
                                        )}
                                    </span>
                                </div>
                                <Button 
                                    className="bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000]"
                                    onClick={() => {
                                        toast.success(`Simulasi Pesan Online: ${previewProduct.name} berhasil ditambahkan ke keranjang!`);
                                    }}
                                >
                                    <ShoppingBag className="h-4 w-4 mr-1.5" /> Pesan Sekarang
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

            </div>
        </AppLayout>
    );
}
