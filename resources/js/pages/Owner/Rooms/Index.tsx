import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Trash2, PlayCircle, Store, QrCode, Printer, Copy, Check, ExternalLink, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as rooms from '@/routes/owner/rooms';
import { Pagination } from '@/components/Pagination';

interface Room {
    id: number;
    name: string;
    type: 'REGULAR' | 'VIP';
    hourly_rate: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    total_sessions: number;
}

export default function RoomsIndex({ rooms: roomData, tenant, filters }: { rooms: any, tenant?: any, filters?: any }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    // QR Code Modal State
    const [selectedQrRoom, setSelectedQrRoom] = useState<Room | null>(null);
    const [copied, setCopied] = useState(false);
    const printCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (search !== filters?.search) {
                router.get(rooms.index.url(), { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const [formData, setFormData] = useState({
        name: '',
        type: 'REGULAR',
        hourly_rate: '',
        status: 'AVAILABLE'
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Ruang & Meja', href: rooms.index.url() },
    ];

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(rooms.store.url(), formData as any, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setFormData({ name: '', type: 'REGULAR', hourly_rate: '', status: 'AVAILABLE' });
                toast.success('Ruang / Meja berhasil ditambahkan');
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
                toast.success('Data ruang / meja berhasil diperbarui');
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
        if (confirm(`Yakin ingin menghapus ${room.name}?`)) {
            router.delete(rooms.destroy.url(room.id), {
                onSuccess: () => toast.success('Ruang / Meja berhasil dihapus'),
                onError: (err) => toast.error(err.error || 'Terjadi kesalahan')
            });
        }
    };

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return <Badge className="bg-green-500 hover:bg-green-600">Tersedia</Badge>;
            case 'OCCUPIED':  return <Badge className="bg-red-500 hover:bg-red-600">Terpakai</Badge>;
            case 'MAINTENANCE': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Perbaikan</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getTableOrderUrl = (room: Room) => {
        const storeId = tenant?.store_id || 'STORE';
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/order/${storeId}?table=${encodeURIComponent(room.name)}`;
    };

    const copyTableLink = (room: Room) => {
        const url = getTableOrderUrl(room);
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(`Link pesan online untuk ${room.name} disalin!`);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrintTableCard = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Ruang & Meja QR" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Ruang & Meja (QR Order)</h2>
                        <p className="text-muted-foreground text-sm">Kelola nomor meja restoran, cetak QR Code meja untuk pesan online, dan stasiun rental.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nomor meja / ruang..."
                                className="pl-8 w-full md:w-[250px]"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#FEB400] text-black hover:bg-[#e0a000] font-semibold">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Meja / Ruang
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roomData.data.map((room: Room) => (
                        <Card key={room.id} className="overflow-hidden border-t-4 border-t-[#FEB400] shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            {room.type === 'VIP' ? <span className="text-purple-500 font-medium">VIP</span> : <span>Regular</span>}
                                            {room.hourly_rate > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{formatRupiah(room.hourly_rate)} / jam</span>
                                                </>
                                            )}
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge(room.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <PlayCircle className="h-4 w-4" />
                                        <span>Total: {room.total_sessions} Sesi / Order</span>
                                    </div>
                                    {room.hourly_rate > 0 && (
                                        <Button variant="link" className="p-0 h-auto text-[#FEB400] text-xs" onClick={() => router.get(rooms.sessions.url(room.id))}>
                                            Lihat Sesi &rarr;
                                        </Button>
                                    )}
                                </div>

                                {/* QR Order Quick Action */}
                                <div className="bg-muted/40 p-2.5 rounded-xl border flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <QrCode className="h-4 w-4 text-[#FEB400] shrink-0" />
                                        <span className="text-xs font-semibold truncate">Pesan Online Meja</span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setSelectedQrRoom(room)}
                                        className="h-7 text-xs bg-background"
                                    >
                                        Cetak QR Meja
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
                            <p>Belum ada data meja / ruang.</p>
                            <p className="text-xs mt-1">Tambahkan meja untuk men-generate QR Code pemesanan online otomatis.</p>
                        </div>
                    )}
                </div>
                <Pagination links={roomData?.links} />
            </div>

            {/* Modal Tambah */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tambah Meja / Ruang Baru</DialogTitle></DialogHeader>
                    <form onSubmit={handleAdd}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Meja / Ruang</Label>
                                <Input id="name" placeholder="Contoh: Meja 01, VIP Room 1, Outdoor A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipe</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">Tarif Sewa per Jam (Rp) <span className="text-xs text-muted-foreground font-normal">(Isi 0 jika hanya meja makan F&B)</span></Label>
                                <Input id="hourly_rate" type="number" placeholder="0" value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value})} required />
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
                    <DialogHeader><DialogTitle>Edit Meja / Ruang</DialogTitle></DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_name">Nama Meja / Ruang</Label>
                                <Input id="edit_name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_type">Tipe</Label>
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
                                        <SelectItem value="OCCUPIED">Terpakai</SelectItem>
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

            {/* Modal QR Code Meja & Kartu Meja Cetak */}
            {selectedQrRoom && (
                <Dialog open={Boolean(selectedQrRoom)} onOpenChange={(open) => !open && setSelectedQrRoom(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-[#FEB400]" /> QR Code Pesan Online - {selectedQrRoom.name}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Printable Table Stand Card */}
                        <div 
                            ref={printCardRef}
                            className="bg-white text-black p-6 rounded-2xl border-2 border-dashed border-amber-400 text-center space-y-4 shadow-sm my-2"
                        >
                            <div className="space-y-0.5">
                                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 block">
                                    {tenant?.business_name || 'KILATZ RESTO & CAFE'}
                                </span>
                                <h3 className="text-2xl font-black tracking-tight">{selectedQrRoom.name.toUpperCase()}</h3>
                            </div>

                            {/* QR Code Image */}
                            <div className="flex justify-center my-2">
                                <div className="p-3 bg-white rounded-xl border shadow-xs inline-block">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getTableOrderUrl(selectedQrRoom))}`}
                                        alt={`QR Code ${selectedQrRoom.name}`}
                                        className="w-44 h-44 mx-auto"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-800">
                                    SCAN UNTUK PESAN & BAYAR DARI HP
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    Buka kamera ponsel Anda dan arahkan ke QR Code di atas. Tanpa perlu download aplikasi.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            <div className="flex gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => copyTableLink(selectedQrRoom)}
                                    className="flex-1 text-xs"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                    {copied ? 'Link Disalin!' : 'Salin Link Meja'}
                                </Button>

                                <a 
                                    href={getTableOrderUrl(selectedQrRoom)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1"
                                >
                                    <Button type="button" variant="outline" className="w-full text-xs">
                                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka Menu
                                    </Button>
                                </a>
                            </div>

                            <Button 
                                type="button" 
                                onClick={handlePrintTableCard}
                                className="w-full bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000]"
                            >
                                <Printer className="h-4 w-4 mr-2" /> Cetak Kartu Meja (Print QR Stand)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

        </AppLayout>
    );
}
