import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function UnitConversionsIndex({ conversions }: { conversions: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({
        id: null,
        base_unit: '',
        target_unit: '',
        conversion_rate: ''
    });

    const openCreateModal = () => {
        setFormData({ id: null, base_unit: '', target_unit: '', conversion_rate: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (conversion: any) => {
        setFormData({
            id: conversion.id,
            base_unit: conversion.base_unit,
            target_unit: conversion.target_unit,
            conversion_rate: conversion.conversion_rate
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditing) {
            router.put(`/owner/unit-conversions/${formData.id}`, formData, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Konversi berhasil diperbarui'); },
                onError: (err) => { 
                    if(err.target_unit) toast.error('Konversi satuan ini sudah ada!');
                    else toast.error('Terjadi kesalahan saat menyimpan konversi'); 
                }
            });
        } else {
            router.post('/owner/unit-conversions', formData, {
                onSuccess: () => { setIsModalOpen(false); toast.success('Konversi berhasil ditambahkan'); },
                onError: (err) => { 
                    if(err.target_unit) toast.error('Konversi satuan ini sudah ada!');
                    else toast.error('Terjadi kesalahan saat menyimpan konversi'); 
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus konversi satuan ini?')) {
            router.delete(`/owner/unit-conversions/${id}`, {
                onSuccess: () => toast.success('Konversi satuan berhasil dihapus')
            });
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Konversi Satuan', href: '/owner/unit-conversions' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Konversi Satuan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manajemen Konversi Satuan</h1>
                        <p className="text-muted-foreground mt-1">Atur nilai konversi dari satu satuan ke satuan lain (contoh: 1 lonjor = 100 cup).</p>
                    </div>
                    <Button onClick={openCreateModal} className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Konversi
                    </Button>
                </div>

                <Card>
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-lg">Daftar Konversi</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Satuan Dasar (Bahan Baku)</TableHead>
                                    <TableHead className="w-10 text-center"></TableHead>
                                    <TableHead>Satuan Target (Resep)</TableHead>
                                    <TableHead className="text-center">Nilai Konversi</TableHead>
                                    <TableHead className="text-center">Penjelasan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conversions.length > 0 ? conversions.map((conversion) => (
                                    <TableRow key={conversion.id}>
                                        <TableCell className="font-medium text-blue-600">{conversion.base_unit}</TableCell>
                                        <TableCell className="text-center"><ArrowRight className="h-4 w-4 text-muted-foreground inline-block" /></TableCell>
                                        <TableCell className="font-medium text-orange-600">{conversion.target_unit}</TableCell>
                                        <TableCell className="text-center font-bold">{parseFloat(conversion.conversion_rate)}</TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            1 {conversion.base_unit} = {parseFloat(conversion.conversion_rate)} {conversion.target_unit}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(conversion)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(conversion.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Belum ada data konversi satuan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit' : 'Tambah'} Konversi Satuan</DialogTitle>
                                <DialogDescription>
                                    Tentukan berapa nilai konversi dari Satuan Dasar (Bahan Baku) ke Satuan Target (Resep).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Satuan Dasar (Contoh: lonjor, kg, liter)</Label>
                                    <Input required value={formData.base_unit} onChange={e => setFormData({...formData, base_unit: e.target.value.toLowerCase()})} placeholder="Misal: lonjor" />
                                    <p className="text-xs text-muted-foreground">Pastikan nama satuan dasar ini sama persis dengan satuan yang digunakan di menu Bahan Baku.</p>
                                </div>
                                <div className="flex items-center justify-center py-2">
                                    <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium">
                                        <span>1 {formData.base_unit || '...'}</span>
                                        <ArrowRight className="h-4 w-4" />
                                        <span>{formData.conversion_rate || '?'} {formData.target_unit || '...'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nilai Konversi</Label>
                                        <Input type="number" step="any" min="0.000001" required value={formData.conversion_rate} onChange={e => setFormData({...formData, conversion_rate: e.target.value})} placeholder="Misal: 100" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Satuan Target (Resep)</Label>
                                        <Input required value={formData.target_unit} onChange={e => setFormData({...formData, target_unit: e.target.value.toLowerCase()})} placeholder="Misal: cup" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
