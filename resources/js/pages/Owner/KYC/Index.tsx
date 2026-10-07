import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Clock, 
    QrCode, 
    Upload, 
    Building2, 
    CreditCard, 
    CheckCircle2, 
    AlertCircle, 
    XCircle,
    Store
} from 'lucide-react';
import { toast } from 'sonner';

interface KycData {
    id: number;
    id_card_number: string;
    id_card_name: string;
    id_card_photo_url: string | null;
    bank_name: string;
    bank_label: string;
    bank_account_number: string;
    bank_account_holder_name: string;
    business_photo_url: string | null;
    business_type: string | null;
    status: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
    is_approved: boolean;
    rejection_reason: string | null;
    verified_at: string | null;
}

interface Tenant {
    id: number;
    business_name: string;
    store_id: string;
}

export default function KycIndex({
    tenant,
    kyc,
    bankList,
}: {
    tenant: Tenant;
    kyc: KycData | null;
    bankList: Record<string, string>;
}) {
    const status = kyc?.status || 'unsubmitted';
    const isApproved = status === 'approved';
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';

    const [ktpPreview, setKtpPreview] = useState<string | null>(kyc?.id_card_photo_url || null);
    const [businessPreview, setBusinessPreview] = useState<string | null>(kyc?.business_photo_url || null);

    const { data, setData, post, processing, errors } = useForm({
        tenant_id: tenant.id,
        id_card_number: kyc?.id_card_number || '',
        id_card_name: kyc?.id_card_name || '',
        id_card_photo: null as File | null,
        bank_name: kyc?.bank_name || 'BCA',
        bank_account_number: kyc?.bank_account_number || '',
        bank_account_holder_name: kyc?.bank_account_holder_name || '',
        business_photo: null as File | null,
        business_type: kyc?.business_type || 'F&B / Cafe',
    });

    const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('id_card_photo', file);
            setKtpPreview(URL.createObjectURL(file));
        }
    };

    const handleBusinessPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('business_photo', file);
            setBusinessPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('owner.kyc.store'), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Dokumen KYC berhasil diajukan! Admin akan meninjau dalam 1x24 jam.');
            },
            onError: (err) => {
                toast.error('Gagal mengajukan KYC. Mohon periksa kembali isian formulir.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Verifikasi KYC QRIS Dinamis" />

            <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Verifikasi KYC & QRIS Dinamis
                            </h1>
                            <Badge variant={isApproved ? 'default' : isPending ? 'secondary' : 'destructive'} className="uppercase">
                                {status === 'approved' ? 'QRIS Aktif' : status === 'pending' ? 'Menunggu Tinjauan' : status === 'rejected' ? 'Ditolak' : 'Belum Diverifikasi'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Outlet: <span className="font-semibold text-foreground">{tenant.business_name}</span> ({tenant.store_id})
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${
                            isApproved 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                                : isPending 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                                : isRejected
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                                : 'bg-muted border-border text-muted-foreground'
                        }`}>
                            <QrCode className="h-6 w-6" />
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider block">Status QRIS</span>
                                <span className="text-xs font-semibold">
                                    {isApproved ? 'Dapat Dipakai (Enabled)' : 'Terkunci (Disabled)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Notice Banners */}
                {isApproved && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                                Verifikasi Berhasil & QRIS Dinamis Aktif
                            </h4>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                Akun outlet Anda telah terverifikasi sejak {kyc?.verified_at}. Anda dapat langsung menggunakan fitur QRIS Dinamis pada POS Kasir dan Web Pemesanan Meja.
                            </p>
                        </div>
                    </div>
                )}

                {isPending && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                                Pengajuan Sedang Ditinjau Tim Admin Kilatz
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                Berkas KTP, rekening bank, dan foto outlet Anda sedang dalam proses verifikasi kelayakan. Fitur QRIS Dinamis akan aktif otomatis begitu disetujui.
                            </p>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100">
                                Permohonan KYC Ditolak
                            </h4>
                            <p className="text-xs text-rose-800 dark:text-rose-300">
                                Alasan penolakan: <span className="font-semibold">{kyc?.rejection_reason || 'Dokumen belum memenuhi syarat.'}</span>
                            </p>
                            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                                Silakan perbaiki data atau unggah kembali foto KTP / foto usaha yang lebih jelas pada form di bawah.
                            </p>
                        </div>
                    </div>
                )}

                {/* KYC Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: KTP Verifikasi */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-5 w-5" />
                                <CardTitle className="text-lg">1. Identitas Pemilik (KTP)</CardTitle>
                            </div>
                            <CardDescription>
                                Masukkan 16 digit NIK dan nama lengkap sesuai kartu tanda penduduk pemilik usaha.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="id_card_number">Nomor Induk Kependudukan (NIK)</Label>
                                    <Input
                                        id="id_card_number"
                                        placeholder="16 digit NIK KTP"
                                        maxLength={16}
                                        value={data.id_card_number}
                                        onChange={(e) => setData('id_card_number', e.target.value.replace(/\D/g, ''))}
                                        disabled={isApproved}
                                        required
                                    />
                                    {errors.id_card_number && (
                                        <p className="text-xs text-destructive">{errors.id_card_number}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="id_card_name">Nama Lengkap (Sesuai KTP)</Label>
                                    <Input
                                        id="id_card_name"
                                        placeholder="Contoh: Budi Santoso"
                                        value={data.id_card_name}
                                        onChange={(e) => setData('id_card_name', e.target.value)}
                                        disabled={isApproved}
                                        required
                                    />
                                    {errors.id_card_name && (
                                        <p className="text-xs text-destructive">{errors.id_card_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Unggah Foto KTP Asli</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {ktpPreview && (
                                        <div className="w-48 h-32 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
                                            <img src={ktpPreview} alt="KTP Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {!isApproved && (
                                        <label className="flex-1 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-card hover:bg-muted/50 transition-colors w-full">
                                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                            <span className="text-xs font-semibold text-foreground">Klik untuk pilih berkas foto KTP</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG atau WebP (Maks. 5MB)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleKtpChange}
                                                className="hidden"
                                                required={!ktpPreview}
                                            />
                                        </label>
                                    )}
                                </div>
                                {errors.id_card_photo && (
                                    <p className="text-xs text-destructive">{errors.id_card_photo}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Rekening Bank */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-primary">
                                <CreditCard className="h-5 w-5" />
                                <CardTitle className="text-lg">2. Rekening Bank Pencairan Dana</CardTitle>
                            </div>
                            <CardDescription>
                                Digunakan untuk settlement omzet transaksi QRIS ke rekening merchant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_name">Pilih Bank</Label>
                                    <select
                                        id="bank_name"
                                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        disabled={isApproved}
                                        required
                                    >
                                        {Object.entries(bankList).map(([code, label]) => (
                                            <option key={code} value={code}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.bank_name && (
                                        <p className="text-xs text-destructive">{errors.bank_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_account_number">Nomor Rekening</Label>
                                    <Input
                                        id="bank_account_number"
                                        placeholder="Contoh: 1234567890"
                                        value={data.bank_account_number}
                                        onChange={(e) => setData('bank_account_number', e.target.value.replace(/\D/g, ''))}
                                        disabled={isApproved}
                                        required
                                    />
                                    {errors.bank_account_number && (
                                        <p className="text-xs text-destructive">{errors.bank_account_number}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_account_holder_name">Nama Pemilik Rekening</Label>
                                    <Input
                                        id="bank_account_holder_name"
                                        placeholder="Nama pada buku tabungan"
                                        value={data.bank_account_holder_name}
                                        onChange={(e) => setData('bank_account_holder_name', e.target.value)}
                                        disabled={isApproved}
                                        required
                                    />
                                    {errors.bank_account_holder_name && (
                                        <p className="text-xs text-destructive">{errors.bank_account_holder_name}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Foto Usaha */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 text-primary">
                                <Store className="h-5 w-5" />
                                <CardTitle className="text-lg">3. Foto Tempat Usaha / Outlet</CardTitle>
                            </div>
                            <CardDescription>
                                Unggah foto tampak depan atau suasana gerai/outlet sebagai bukti fisik operasional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="business_type">Kategori / Jenis Usaha</Label>
                                <Input
                                    id="business_type"
                                    placeholder="Contoh: Kedai Kopi, Warung Makan, Bakery, Cafe"
                                    value={data.business_type}
                                    onChange={(e) => setData('business_type', e.target.value)}
                                    disabled={isApproved}
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Foto Gerai / Tempat Usaha</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {businessPreview && (
                                        <div className="w-48 h-32 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
                                            <img src={businessPreview} alt="Business Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {!isApproved && (
                                        <label className="flex-1 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-card hover:bg-muted/50 transition-colors w-full">
                                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                            <span className="text-xs font-semibold text-foreground">Klik untuk pilih foto tempat usaha</span>
                                            <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG atau WebP (Maks. 5MB)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBusinessPhotoChange}
                                                className="hidden"
                                                required={!businessPreview}
                                            />
                                        </label>
                                    )}
                                </div>
                                {errors.business_photo && (
                                    <p className="text-xs text-destructive">{errors.business_photo}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    {!isApproved && (
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={processing}
                                className="min-w-[180px]"
                            >
                                {processing ? 'Mengirim Data...' : isRejected ? 'Ajukan Ulang Verifikasi' : 'Kirim Verifikasi KYC'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}
