import { Head, router } from '@inertiajs/react';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Unlink, HardDrive, Sparkles, FolderCheck } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type DriveStatus = {
    is_connected: boolean;
    email: string | null;
    folder_id: string | null;
    updated_at: string | null;
};

type Props = {
    drive: DriveStatus;
    status?: string;
    error?: string;
};

export default function GoogleDriveSettings({ drive, status, error }: Props) {
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleConnect = () => {
        window.location.href = '/settings/google-drive/auth';
    };

    const handleDisconnect = () => {
        if (confirm('Apakah Anda yakin ingin memutuskan koneksi Google Drive? Foto baru akan disimpan di server lokal.')) {
            setIsDisconnecting(true);
            router.post('/settings/google-drive/disconnect', {}, {
                onFinish: () => setIsDisconnecting(false),
            });
        }
    };

    return (
        <>
            <Head title="Integrasi Google Drive" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Integrasi Google Drive"
                    description="Gunakan penyimpanan cloud Google Drive pribadi Anda untuk menyimpan semua foto produk secara otomatis dan gratis."
                />

                {status && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{status}</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                                <HardDrive className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">Google Drive Storage</h3>
                                <p className="text-sm text-muted-foreground">
                                    Penyimpanan 15 GB gratis per akun Google
                                </p>
                            </div>
                        </div>

                        <div>
                            {drive.is_connected ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Terhubung
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    Belum Terhubung
                                </span>
                            )}
                        </div>
                    </div>

                    {drive.is_connected ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Akun Google
                                    </span>
                                    <p className="text-sm font-semibold truncate">
                                        {drive.email || 'Akun Terhubung'}
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <FolderCheck className="w-3.5 h-3.5 text-blue-500" /> Folder Tujuan
                                    </span>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        Kilatz POS - Produk
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    Kompresi Otomatis Aktif
                                </div>
                                <p>
                                    Setiap foto produk yang Anda upload otomatis dikonversi ke format WebP (maks 800px, ~40-80KB) sebelum diupload ke folder Google Drive Anda. Server Kilatz tidak menggunakan kuota disk atau bandwidth server utama.
                                </p>
                            </div>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleConnect}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Ganti / Perbarui Akun
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    className="gap-2"
                                >
                                    <Unlink className="w-4 h-4" />
                                    {isDisconnecting ? 'Memutuskan...' : 'Putuskan Koneksi'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>
                                    Dengan menghubungkan Google Drive:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5 text-xs text-foreground/80">
                                    <li>Foto produk Anda tersimpan aman dan privat di akun Google Drive pribadi Anda.</li>
                                    <li>Otomatis dikompresi ke <strong>WebP kualitas tinggi (hemat 80% ukuran file)</strong>.</li>
                                    <li>Foto dapat langsung ditampilkan di Menu Pemesanan Online (QR Code) pelanggan via CDN berkecepatan tinggi.</li>
                                    <li>Tidak ada batasan penyimpanan dari server POS Kilatz.</li>
                                </ul>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handleConnect}
                                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md font-medium"
                                >
                                    <Cloud className="w-4 h-4" />
                                    Hubungkan dengan Google Drive
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

GoogleDriveSettings.layout = {
    breadcrumbs: [
        {
            title: 'Google Drive',
            href: '/settings/google-drive',
        },
    ],
};
