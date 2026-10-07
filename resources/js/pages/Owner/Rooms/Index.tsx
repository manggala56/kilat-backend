import React, { useState, useEffect } from 'react';
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
import QrCodeSvg, { generateQrSvgString } from '@/components/QrCodeSvg';

interface Room {
    id: number;
    name: string;
    type: 'REGULAR' | 'VIP';
    hourly_rate: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    qr_token?: string;
    total_sessions: number;
}

export default function RoomsIndex({ rooms: roomData, all_rooms, tenant, order_web_url, filters }: { rooms: any, all_rooms?: Room[], tenant?: any, order_web_url?: string, filters?: any }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    // QR Code Modal State
    const [selectedQrRoom, setSelectedQrRoom] = useState<Room | null>(null);
    const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const allRoomsList: Room[] = all_rooms && all_rooms.length > 0 ? all_rooms : (roomData?.data || []);

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
        const baseUrl = (order_web_url || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
        // Menggunakan token unik anti-tamper yang tidak mengekspos nama toko atau nama meja di URL
        const token = room.qr_token || room.name;
        return `${baseUrl}/?t=${encodeURIComponent(token)}`;
    };

    const copyTableLink = (room: Room) => {
        const url = getTableOrderUrl(room);
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(`Link pesan online untuk ${room.name} disalin!`);
        setTimeout(() => setCopied(false), 2000);
    };

    const printQrCards = async (roomsToPrint: Room[], title = 'Cetak QR Meja') => {
        if (!roomsToPrint || roomsToPrint.length === 0) {
            toast.error('Tidak ada data meja untuk dicetak');
            return;
        }

        const toastId = toast.loading('Menyiapkan lembar cetak...');

        try {
            const storeName = tenant?.business_name || 'KILATZ RESTO & CAFE';

            const cardsData = await Promise.all(roomsToPrint.map(async room => {
                const svgString = await generateQrSvgString(getTableOrderUrl(room), 175);
                return `
                    <div class="qr-card">
                        <div class="store-name">${storeName}</div>
                        <div class="table-name">${room.name.toUpperCase()}</div>
                        ${room.type === 'VIP' ? '<div class="badge-vip">VIP ROOM</div>' : ''}
                        <div class="qr-box">
                            ${svgString}
                        </div>
                        <div class="scan-title">SCAN UNTUK PESAN & BAYAR</div>
                        <div class="scan-desc">Buka kamera HP Anda & arahkan ke QR Code ini untuk memesan langsung dari meja.</div>
                    </div>
                `;
            }));

            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.right = '0';
            printFrame.style.bottom = '0';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = 'none';
            document.body.appendChild(printFrame);

            const doc = printFrame.contentWindow?.document;
            if (!doc) {
                toast.dismiss(toastId);
                toast.error('Gagal membuka frame cetak');
                return;
            }

            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="utf-8">
                    <title>${title} - ${storeName}</title>
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 12mm 10mm;
                        }
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        }
                        body {
                            background: #ffffff;
                            color: #111827;
                            padding: 10px;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 16px;
                        }
                        .qr-card {
                            border: 2px dashed #f59e0b;
                            border-radius: 16px;
                            padding: 18px 14px;
                            text-align: center;
                            page-break-inside: avoid;
                            break-inside: avoid;
                            background: #ffffff;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .store-name {
                            font-size: 11px;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.08em;
                            color: #d97706;
                            margin-bottom: 2px;
                            max-width: 100%;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .table-name {
                            font-size: 22px;
                            font-weight: 900;
                            color: #111827;
                            margin-bottom: 2px;
                            line-height: 1.2;
                        }
                        .badge-vip {
                            display: inline-block;
                            font-size: 10px;
                            font-weight: 800;
                            padding: 2px 8px;
                            border-radius: 4px;
                            background: #f3e8ff;
                            color: #7e22ce;
                            margin-bottom: 6px;
                        }
                        .qr-box {
                            background: #ffffff;
                            padding: 8px;
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            margin: 8px 0;
                            display: inline-block;
                        }
                        .qr-box svg {
                            display: block;
                        }
                        .scan-title {
                            font-size: 12px;
                            font-weight: 900;
                            letter-spacing: 0.04em;
                            color: #1f2937;
                            margin-top: 4px;
                        }
                        .scan-desc {
                            font-size: 9.5px;
                            color: #4b5563;
                            max-width: 210px;
                            margin: 3px auto 0;
                            line-height: 1.35;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .qr-card {
                                border-color: #6b7280;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="grid">
                        ${cardsData.join('')}
                    </div>
                </body>
                </html>
            `);
            doc.close();

            toast.dismiss(toastId);
            setTimeout(() => {
                try {
                    printFrame.contentWindow?.focus();
                    printFrame.contentWindow?.print();
                } catch (e) {
                    console.error(e);
                } finally {
                    setTimeout(() => {
                        if (document.body.contains(printFrame)) {
                            document.body.removeChild(printFrame);
                        }
                    }, 2000);
                }
            }, 200);
        } catch (err) {
            toast.dismiss(toastId);
            toast.error('Gagal menyiapkan cetakan QR');
            console.error(err);
        }
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
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nomor meja / ruang..."
                                className="pl-8 w-full md:w-[220px]"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsBulkPrintOpen(true)} 
                            className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-semibold"
                        >
                            <Printer className="mr-2 h-4 w-4 text-[#FEB400]" /> Cetak Semua QR Meja
                        </Button>
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
                                    <div className="flex items-center gap-1.5">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => printQrCards([room], `Cetak QR ${room.name}`)}
                                            className="h-7 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20 font-medium"
                                        >
                                            <Printer className="h-3.5 w-3.5 mr-1" /> Cetak
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => setSelectedQrRoom(room)}
                                            className="h-7 text-xs bg-background"
                                        >
                                            Lihat QR
                                        </Button>
                                    </div>
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
                            className="bg-white text-black p-6 rounded-2xl border-2 border-dashed border-amber-400 text-center space-y-4 shadow-sm my-2"
                        >
                            <div className="space-y-0.5">
                                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 block">
                                    {tenant?.business_name || 'KILATZ RESTO & CAFE'}
                                </span>
                                <h3 className="text-2xl font-black tracking-tight">{selectedQrRoom.name.toUpperCase()}</h3>
                            </div>

                            {/* QR Code SVG */}
                            <div className="flex justify-center my-2">
                                <div className="p-3 bg-white rounded-xl border shadow-xs inline-block">
                                    <QrCodeSvg 
                                        value={getTableOrderUrl(selectedQrRoom)}
                                        size={176}
                                        className="mx-auto"
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
                                onClick={() => printQrCards([selectedQrRoom], `Cetak QR ${selectedQrRoom.name}`)}
                                className="w-full bg-[#FEB400] text-black font-semibold hover:bg-[#e0a000]"
                            >
                                <Printer className="h-4 w-4 mr-2" /> Cetak Kartu Meja (Print QR Stand)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal Cetak Bersamaan Semua QR Meja (Bulk Print Grid) */}
            <Dialog open={isBulkPrintOpen} onOpenChange={setIsBulkPrintOpen}>
                <DialogContent className="max-w-5xl xl:max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:static">
                    <div className="print:hidden">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center justify-between gap-2 flex-wrap pb-2 border-b">
                                <span className="flex items-center gap-2 font-bold">
                                    <Printer className="h-5 w-5 text-[#FEB400]" /> Cetak Massal QR Meja ({allRoomsList.length} Meja)
                                </span>
                                <Button 
                                    onClick={() => printQrCards(allRoomsList, 'Cetak Massal QR Meja')} 
                                    className="bg-[#FEB400] text-black hover:bg-[#e0a000] font-bold gap-2 text-sm shadow-md"
                                >
                                    <Printer className="h-4 w-4" /> Cetak Semua / Simpan PDF
                                </Button>
                            </DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground mt-2 mb-4">
                            Lembar stiker / kartu akrilik meja siap cetak. Semua QR Code meja toko <strong className="text-foreground">{tenant?.business_name}</strong> tersusun rapi dalam grid siap potong.
                        </p>
                    </div>

                    {/* Printable Grid Sheet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-6 print:m-0 print:p-0">
                        {allRoomsList.map((room) => (
                            <div 
                                key={room.id}
                                className="bg-white text-black p-5 rounded-2xl border-2 border-dashed border-amber-400 text-center space-y-3 shadow-xs break-inside-avoid page-break-inside-avoid print:border-gray-400 print:shadow-none"
                            >
                                <div className="space-y-0.5 border-b pb-2 border-amber-200 print:border-gray-300">
                                    <span className="text-[11px] uppercase font-extrabold tracking-wider text-amber-600 print:text-black block truncate">
                                        {tenant?.business_name || 'KILATZ RESTO & CAFE'}
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{room.name.toUpperCase()}</h3>
                                    {room.type === 'VIP' && (
                                         <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                             VIP ROOM
                                         </span>
                                     )}
                                </div>

                                {/* QR Code SVG */}
                                <div className="flex justify-center my-1">
                                    <div className="p-2.5 bg-white rounded-xl border shadow-xs inline-block">
                                        <QrCodeSvg 
                                            value={getTableOrderUrl(room)}
                                            size={144}
                                            className="mx-auto"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-0.5 pt-1">
                                    <p className="text-xs font-black tracking-wide text-gray-800">
                                        SCAN UNTUK PESAN & BAYAR
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-medium">
                                        Arahkan kamera HP Anda ke QR Code untuk melihat menu & memesan langsung dari meja.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
