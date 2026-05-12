import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CalendarDays, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as rooms from '@/routes/owner/rooms';

export default function RoomSessions({ room, sessions }: { room: any, sessions: any }) {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Ruang', href: rooms.index.url() },
        { title: `Sesi ${room.name}`, href: rooms.sessions.url(room.id) },
    ];

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
    };

    const formatRupiah = (amount: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return '-';
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHrs}j ${diffMins}m`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Riwayat Sesi - ${room.name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={rooms.index.url()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#FEB400]">Riwayat Sesi: {room.name}</h2>
                        <p className="text-muted-foreground text-sm">Menampilkan histori pemakaian {room.type === 'VIP' ? 'VIP' : 'Regular'}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Log Aktivitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><div className="flex items-center gap-1"><CalendarDays className="h-4 w-4"/> Mulai</div></TableHead>
                                    <TableHead><div className="flex items-center gap-1"><CalendarDays className="h-4 w-4"/> Selesai</div></TableHead>
                                    <TableHead>Durasi</TableHead>
                                    <TableHead><div className="flex items-center gap-1"><Receipt className="h-4 w-4"/> Total Biaya</div></TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.data.map((session: any) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-medium">{formatDateTime(session.start_time)}</TableCell>
                                        <TableCell>{formatDateTime(session.end_time)}</TableCell>
                                        <TableCell>{calculateDuration(session.start_time, session.end_time)}</TableCell>
                                        <TableCell className="font-bold text-[#FEB400]">{formatRupiah(session.total_cost)}</TableCell>
                                        <TableCell>
                                            {session.status === 'ACTIVE' ? (
                                                <Badge className="bg-green-500 animate-pulse">Sedang Berjalan</Badge>
                                            ) : (
                                                <Badge variant="secondary">Selesai</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sessions.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Belum ada riwayat sesi pemakaian.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
