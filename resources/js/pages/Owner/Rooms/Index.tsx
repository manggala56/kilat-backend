import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Trash2, Clock, PlayCircle, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as rooms from '@/routes/owner/rooms';

interface Room {
    id: number;
    name: string;
    type: 'REGULAR' | 'VIP';
    hourly_rate: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    total_sessions: number;
}

export default function RoomsIndex({ rooms: roomData }: { rooms: any }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'REGULAR',
        hourly_rate: '',
        status: 'AVAILABLE'
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Ruang (PS)', href: rooms.index.url() },
    ];

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(rooms.store.url(), formData as any, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setFormData({ name: '', type: 'REGULAR', hourly_rate: '', status: 'AVAILABLE' });
                toast.success('Ruang berhasil ditambahkan');
            },
            onError: (err) => {
                toast.error(err.name || err.hourly_rate || 'Terjadi kesalahan');
            }
        });
    };

    const openEditModal = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            name: room.name,
            type: room.type,
            hourly_rate: room.hourly_rate.toString(),
            status: room.status
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoom) return;

        router.put(rooms.update.url(editingRoom.id), formData as any, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success('Data ruang berhasil diperbarui');
            },
            onError: (err) => {
                toast.error(err.name || err.hourly_rate || 'Terjadi kesalahan');
            }
        });
    };

    const handleDelete = (room: Room) => {
        if (room.status === 'OCCUPIED') {
            toast.error('Tidak bisa menghapus ruang yang sedang digunakan');
            return;
        }
        if (confirm(`Yakin ingin menghapus ruang ${room.name}?`)) {
            router.delete(rooms.destroy.url(room.id), {
                onSuccess: () => toast.success('Ruang berhasil dihapus'),
                onError: (err) => toast.error(err.error || 'Terjadi kesalahan')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return <Badge className="bg-green-500 hover:bg-green-600">Tersedia</Badge>;
            case 'OCCUPIED':  return <Badge className="bg-red-500 hover:bg-red-600">Terpakai</Badge>;
            case 'MAINTENANCE': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Perbaikan</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Ruang PS/Rental" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Ruang / Station</h2>
                        <p className="text-muted-foreground text-sm">Kelola daftar ruang PS atau rental Anda.</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#FEB400] text-black hover:bg-[#e0a000]">
                        <Plus className="mr-2 h-4 w-4" /> Tambah Ruang
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roomData.data.map((room: Room) => (
                        <Card key={room.id} className="overflow-hidden border-t-4 border-t-[#FEB400]">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{room.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            {room.type === 'VIP' ? <span className="text-purple-500 font-medium">VIP</span> : <span>Regular</span>}
                                            <span>•</span>
                                            <span>{formatRupiah(room.hourly_rate)} / jam</span>
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge(room.status)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <PlayCircle className="h-4 w-4" />
                                        <span>Total: {room.total_sessions} Sesi</span>
                                    </div>
                                    <Button variant="link" className="p-0 h-auto text-[#FEB400]" onClick={() => router.get(rooms.sessions.url(room.id))}>
                                        Lihat Riwayat &rarr;
                                    </Button>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(room)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(room)} disabled={room.status === 'OCCUPIED'}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    {roomData.data.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg">
                            <Store className="mx-auto h-12 w-12 opacity-20 mb-3" />
                            <p>Belum ada data ruang/station.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Ruang Baru</DialogTitle></DialogHeader>
                    <form onSubmit={handleAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Ruang/Station</Label>
                                <Input id="name" placeholder="Contoh: PS5 Station 1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipe Ruang</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">Tarif per Jam (Rp)</Label>
                                <Input id="hourly_rate" type="number" placeholder="15000" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value})} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Ruang</DialogTitle></DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_name">Nama Ruang/Station</Label>
                                <Input id="edit_name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_type">Tipe Ruang</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_hourly_rate">Tarif per Jam (Rp)</Label>
                                <Input id="edit_hourly_rate" type="number" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value})} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_status">Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                                        <SelectItem value="MAINTENANCE">Perbaikan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                            <Button type="submit" className="bg-[#FEB400] text-black hover:bg-[#e0a000]">Update</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
