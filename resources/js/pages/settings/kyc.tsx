import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
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

interface Props {
    tenant: Tenant;
    kyc: KycData | null;
    bankList: Record<string, string>;
    status?: string;
}

export default function KycSettings({ tenant, kyc, bankList, status: flashStatus }: Props) {
    const kycStatus = kyc?.status || 'unsubmitted';
    const isApproved = kycStatus === 'approved';
    const isPending = kycStatus === 'pending';
    const isRejected = kycStatus === 'rejected';

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
        post('/settings/kyc', {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Dokumen KYC berhasil dikirim. Admin akan memverifikasi dalam 1x24 jam.');
            },
            onError: () => {
                toast.error('Gagal mengajukan KYC. Mohon periksa kembali isian formulir.');
            },
        });
    };

    return (
        <>
            <Head title="Verifikasi KYC & QRIS" />

            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Verifikasi KYC & QRIS Dinamis"
                        description="Lengkapi identitas KTP, rekening penampungan bank, dan foto gerai untuk mengaktifkan pembayaran QRIS Dinamis secara otomatis."
                    />
                    <Badge 
                        variant={isApproved ? 'default' : isPending ? 'secondary' : isRejected ? 'destructive' : 'outline'}
                        className="uppercase shrink-0 text-xs px-2.5 py-0.5"
                    >
                        {isApproved ? 'QRIS Aktif' : isPending ? 'Menunggu Tinjauan' : isRejected ? 'Ditolak' : 'Belum Diverifikasi'}
                    </Badge>
                </div>

                {flashStatus && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{flashStatus}</span>
                    </div>
                )}

                {/* Status Notice Cards */}
                {isApproved && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-900 dark:text-emerald-200">
                            <span className="font-bold block text-sm mb-0.5">Outlet Terverifikasi & QRIS Aktif</span>
                            Akun outlet <span className="font-semibold">{tenant.business_name}</span> telah terverifikasi sejak {kyc?.verified_at}. Fitur QRIS Dinamis aktif pada POS Kasir dan Web QR Meja.
                        </div>
                    </div>
                )}

                {isPending && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 dark:text-amber-200">
                            <span className="font-bold block text-sm mb-0.5">Pengajuan Sedang Ditinjau Admin</span>
                            Berkas KTP, rekening bank, dan foto gerai Anda sedang dalam proses peninjauan kelayakan. Begitu disetujui, QRIS Dinamis akan langsung aktif otomatis.
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                            <span className="font-bold block text-sm">Pengajuan KYC Ditolak</span>
                            <p>Alasan penolakan: <span className="font-semibold">{kyc?.rejection_reason || 'Dokumen belum memenuhi ketentuan.'}</span></p>
                            <p className="text-[11px] text-rose-700 dark:text-rose-300">
                                Silakan perbaiki data atau unggah ulang foto yang lebih jelas pada formulir di bawah.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form Pengajuan */}
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    {/* 1. KTP */}
                    <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span>1. Identitas Kependudukan (KTP Pemilik)</span>
                        </div>

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
                            <Label>Foto KTP Asli</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {ktpPreview && (
                                    <div className="w-48 h-32 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
                                        <img src={ktpPreview} alt="KTP Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {!isApproved && (
                                    <label className="flex-1 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-background hover:bg-muted/40 transition-colors w-full">
                                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                        <span className="text-xs font-semibold text-foreground">Pilih berkas foto KTP</span>
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
                    </div>

                    {/* 2. Rekening Bank */}
                    <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span>2. Rekening Bank Pencairan (Settlement)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="bank_name">Pilih Bank</Label>
                                <select
                                    id="bank_name"
                                    className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    </div>

                    {/* 3. Tempat Usaha */}
                    <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                            <Store className="h-4 w-4 text-primary" />
                            <span>3. Foto Tempat Usaha / Gerai</span>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="business_type">Kategori / Jenis Usaha</Label>
                            <Input
                                id="business_type"
                                placeholder="Contoh: Kedai Kopi, Cafe & Resto, Bakery, Foodcourt"
                                value={data.business_type}
                                onChange={(e) => setData('business_type', e.target.value)}
                                disabled={isApproved}
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Foto Gerai / Tampak Depan Usaha</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {businessPreview && (
                                    <div className="w-48 h-32 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
                                        <img src={businessPreview} alt="Business Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {!isApproved && (
                                    <label className="flex-1 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-background hover:bg-muted/40 transition-colors w-full">
                                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                        <span className="text-xs font-semibold text-foreground">Pilih foto fisik outlet</span>
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
                    </div>

                    {!isApproved && (
                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="min-w-[160px] font-semibold"
                            >
                                {processing ? 'Mengirim Data...' : isRejected ? 'Ajukan Ulang Verifikasi' : 'Kirim Verifikasi KYC'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

KycSettings.layout = {
    breadcrumbs: [
        {
            title: 'Verifikasi KYC & QRIS',
            href: '/settings/kyc',
        },
    ],
};
