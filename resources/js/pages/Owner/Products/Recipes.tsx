import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Search, Beaker, Save, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as recipes from '@/routes/owner/recipes';

export default function RecipesIndex({ products, rawMaterials, filters }: { products: any, rawMaterials: any, filters: any }) {
    const [search, setSearch] = useState(filters.search || '');
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [recipeItems, setRecipeItems] = useState<any[]>([]);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Resep & BOM', href: recipes.index.url() },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(recipes.index.url(), { search }, { preserveState: true });
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const openRecipeModal = (product: any) => {
        setSelectedProduct(product);
        if (product.recipe_items && product.recipe_items.length > 0) {
            setRecipeItems(product.recipe_items.map((item: any) => ({
                raw_material_id: item.raw_material_id.toString(),
                quantity: item.quantity,
                raw_material: item.raw_material
            })));
        } else {
            setRecipeItems([]);
        }
        setIsRecipeModalOpen(true);
    };

    const addRecipeRow = () => setRecipeItems([...recipeItems, { raw_material_id: '', quantity: '' }]);

    const removeRecipeRow = (index: number) => {
        const items = [...recipeItems];
        items.splice(index, 1);
        setRecipeItems(items);
    };

    const updateRecipeRow = (index: number, field: string, value: string) => {
        const items = [...recipeItems];
        items[index][field] = value;
        setRecipeItems(items);
    };

    const calculateTotalHpp = () => {
        return recipeItems.reduce((total, item) => {
            if (!item.raw_material_id || !item.quantity) return total;
            const rm = rawMaterials.find((r: any) => r.id.toString() === item.raw_material_id);
            return total + (rm ? parseFloat(item.quantity) * parseFloat(rm.cost_per_unit) : 0);
        }, 0);
    };

    const saveRecipe = () => {
        const validItems = recipeItems.filter(item => item.raw_material_id && item.quantity && parseFloat(item.quantity) > 0);
        router.put(recipes.update.url(selectedProduct.id), { recipe_items: validItems }, {
            onSuccess: () => { setIsRecipeModalOpen(false); toast.success('Resep produk berhasil disimpan'); },
            onError: () => toast.error('Terjadi kesalahan saat menyimpan resep')
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Resep & HPP" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Resep & Bill of Materials</h2>
                        <p className="text-muted-foreground text-sm">Tetapkan bahan baku untuk mengkalkulasi HPP otomatis.</p>
                    </div>
                    <form onSubmit={handleSearch} className="flex relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Cari nama produk..." className="pl-8 w-full md:w-[250px]" value={search} onChange={e => setSearch(e.target.value)} />
                    </form>
                </div>

                <Card className="mt-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Beaker className="h-5 w-5 text-muted-foreground" /> Katalog Produk
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Produk</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Harga Jual</TableHead>
                                    <TableHead className="text-right">Total HPP</TableHead>
                                    <TableHead className="text-center">Margin</TableHead>
                                    <TableHead className="text-right">Resep</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((product: any) => {
                                    const hpp = parseFloat(product.hpp || 0);
                                    const price = parseFloat(product.price);
                                    const margin = price > 0 ? ((price - hpp) / price * 100).toFixed(1) : 0;
                                    const isLoss = hpp > price;

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {product.name}
                                                {product.recipe_items?.length > 0 && (
                                                    <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                                                        {product.recipe_items.length} Bahan
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{product.category?.name || '-'}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(price)}</TableCell>
                                            <TableCell className={`text-right font-medium ${isLoss ? 'text-red-500' : 'text-orange-600'}`}>
                                                {hpp > 0 ? formatRupiah(hpp) : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {hpp > 0 ? (
                                                    <Badge className={isLoss ? 'bg-red-500' : 'bg-green-500'}>{margin}%</Badge>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => openRecipeModal(product)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Atur Resep
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Tidak ada produk ditemukan.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-4">
                            <span>Resep: {selectedProduct?.name}</span>
                            <Badge variant="outline" className="text-lg py-1 px-3">
                                Harga: {selectedProduct ? formatRupiah(selectedProduct.price) : 0}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Tambahkan bahan baku (Bill of Materials) untuk kalkulasi HPP otomatis saat produk terjual.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-muted/30 p-4 rounded-lg mt-2 min-h-[250px]">
                        {recipeItems.length > 0 ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                                    <div className="col-span-6">Bahan Baku</div>
                                    <div className="col-span-3">Kuantitas</div>
                                    <div className="col-span-2 text-right">Biaya</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {recipeItems.map((item, index) => {
                                    const rm = rawMaterials.find((r: any) => r.id.toString() === item.raw_material_id);
                                    const cost = rm && item.quantity ? parseFloat(item.quantity) * parseFloat(rm.cost_per_unit) : 0;
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-6">
                                                <Select value={item.raw_material_id} onValueChange={(v) => updateRecipeRow(index, 'raw_material_id', v)}>
                                                    <SelectTrigger><SelectValue placeholder="Pilih bahan baku" /></SelectTrigger>
                                                    <SelectContent>
                                                        {rawMaterials.map((r: any) => (
                                                            <SelectItem key={r.id} value={r.id.toString()}>
                                                                {r.name} ({formatRupiah(r.cost_per_unit)}/{r.unit})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-3 flex items-center gap-1">
                                                <Input type="number" step="0.01" min="0" value={item.quantity} onChange={(e) => updateRecipeRow(index, 'quantity', e.target.value)} placeholder="Qty" />
                                                <span className="text-xs text-muted-foreground w-6">{rm?.unit || '-'}</span>
                                            </div>
                                            <div className="col-span-2 text-right font-medium text-sm">{formatRupiah(cost)}</div>
                                            <div className="col-span-1 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeRecipeRow(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                                <Beaker className="h-10 w-10 opacity-20 mb-2" />
                                <p>Belum ada bahan baku untuk resep ini.</p>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-dashed">
                            <Button variant="outline" size="sm" onClick={addRecipeRow} className="w-full border-dashed">
                                <Plus className="h-4 w-4 mr-2" /> Tambah Bahan Baru
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="flex sm:justify-between items-center mt-2 border-t pt-4">
                        <div className="flex items-center gap-4 w-full justify-between">
                            <div className="text-sm">
                                <span className="text-muted-foreground mr-2">Estimasi HPP Total:</span>
                                <span className="font-bold text-lg text-orange-600">{formatRupiah(calculateTotalHpp())}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsRecipeModalOpen(false)}>Batal</Button>
                                <Button type="button" onClick={saveRecipe} className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                                    <Save className="h-4 w-4 mr-2" /> Simpan Resep
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
