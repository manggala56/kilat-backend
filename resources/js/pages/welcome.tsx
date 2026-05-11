import { Head, Link } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import {
    Zap,
    Users,
    BarChart3,
    ShieldCheck,
    Smartphone,
    ChevronRight,
    Menu,
    X,
    ArrowRight,
    Star,
    Quote,
    TrendingUp,
    Target,
    ArrowUpRight
} from 'lucide-react';

const PhotoCard = ({ image, category, title, description, size = "small" }: any) => (
    <div className={`group relative overflow-hidden rounded-3xl bg-zinc-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}`}>
        <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-95 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent"></div>
        <div className="absolute bottom-0 p-6 lg:p-8">
            <span className="mb-3 inline-block rounded-full bg-[#FEB400] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-900">
                {category}
            </span>
            <h3 className={`font-black leading-tight text-white tracking-tighter ${size === 'large' ? 'text-3xl lg:text-4xl' : 'text-xl lg:text-2xl'}`}>
                {title}
            </h3>
            <p className="mt-2 text-sm font-medium text-zinc-200 line-clamp-2">
                {description}
            </p>
        </div>
        <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 border border-white/30">
            <ArrowUpRight className="text-white" size={20} />
        </div>
    </div>
);

const AppMockup = ({ children }: any) => (
    <div className="relative mx-auto w-full max-w-[320px]">
        <div className="relative z-10 overflow-hidden rounded-[3.5rem] border-[10px] border-zinc-700 bg-zinc-700 shadow-[0_0_80px_rgba(254,180,0,0.1)]">
            <div className="aspect-[9/19] bg-white">
                {children}
            </div>
            <div className="absolute top-2 left-1/2 h-7 w-28 -translate-x-1/2 rounded-full bg-zinc-700"></div>
        </div>
        <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-[#FEB400]/10 to-zinc-200/5 blur-3xl"></div>
    </div>
);

export default function Welcome() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        
        // Force light mode for landing page
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            // Restore dark mode if it was active
            if (isDark) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-white text-zinc-800 font-sans selection:bg-[#FEB400] selection:text-white">
            <Head title="Welcome to Kilatz" />
            {/* --- NAVIGATION --- */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-9 h-9 bg-[#FEB400] rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
                            <Zap className="text-black fill-current" size={20} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter italic text-zinc-900 underline-offset-4 decoration-[#FEB400]">KILATZ<span className="text-[#FEB400]">.</span></span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <a href="#solusi" className="hover:text-[#FEB400] transition-colors">Solutions</a>
                        <a href="#fitur" className="hover:text-[#FEB400] transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-[#FEB400] transition-colors">Pricing</a>
                        <div className="h-4 w-px bg-zinc-200"></div>
                        <Link href="/login" className="text-zinc-700 hover:text-[#FEB400] transition-colors uppercase font-black">LOGIN</Link>
                        <Link href="/register" className="bg-zinc-800 text-white px-8 py-3.5 rounded-full hover:bg-zinc-700 transition-all shadow-lg font-black tracking-widest">
                            JOIN NOW
                        </Link>
                    </div>

                    <button className="lg:hidden p-2 text-zinc-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-32 bg-white overflow-hidden text-center lg:text-left">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 lg:space-y-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FEB400] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FEB400]"></span>
                            </span>
                            Enterprise Ready POS
                        </div>

                        <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] text-zinc-900 tracking-tighter">
                            DOMINASI <br />
                            <span className="text-[#FEB400] italic">PASAR</span> DENGAN <br /> KETEPATAN.
                        </h1>

                        <p className="text-lg lg:text-xl text-zinc-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Transformasi operasional bisnis Anda dengan sistem kasir tercanggih yang menggabungkan kecepatan kilat dan analisis data mendalam.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                            <Link href="/register" className="group bg-zinc-800 text-white px-10 py-5 rounded-full font-black shadow-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-3 tracking-widest text-sm">
                                START FREE TRIAL
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative lg:mt-0 mt-12">
                        <AppMockup>
                            <div className="flex h-full flex-col bg-white">
                                <div className="bg-white px-6 pt-12 pb-6 flex justify-between items-end border-b border-zinc-50">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dashboard</p>
                                        <h4 className="text-xl font-black tracking-tighter text-zinc-900">Rp 24,5M</h4>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-[#FEB400] flex items-center justify-center shadow-md">
                                        <Zap size={20} className="text-white fill-current" />
                                    </div>
                                </div>
                                <div className="flex-1 px-6 space-y-4 pt-6">
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Sales Target</p>
                                            <span className="text-[9px] font-black text-[#FEB400]">84%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                                            <div className="h-full w-[84%] bg-[#FEB400] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-white rounded-2xl border border-zinc-100">
                                            <BarChart3 size={16} className="text-zinc-400 mb-2" />
                                            <p className="text-[10px] font-black italic text-zinc-800">+12.4%</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-zinc-100">
                                            <Users size={16} className="text-zinc-400 mb-2" />
                                            <p className="text-[10px] font-black italic text-zinc-800">480 Staf</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AppMockup>
                    </div>
                </div>
            </section>

            {/* --- SOLUTIONS --- */}
            <section id="solusi" className="py-24 lg:py-32 bg-zinc-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
                        <div className="max-w-2xl text-left">
                            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter italic uppercase leading-none mb-6 text-zinc-900">
                                DIRANCANG UNTUK <br /> <span className="text-[#FEB400]">PERTUMBUHAN</span>.
                            </h2>
                            <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                                Infrastruktur fleksibel untuk berbagai industri. Dari operasional harian hingga ekspansi global berskala besar.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        <PhotoCard
                            size="large"
                            image="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop"
                            category="Specialty Coffee & Cafe"
                            title="Skalabilitas Tanpa Batas untuk Outlet"
                            description="Kelola ratusan cabang kafe Anda dengan sinkronisasi stok real-time dan manajemen resep terpusat."
                        />
                        <PhotoCard
                            image="https://images.unsplash.com/photo-1534452286302-2f5004576b50?q=80&w=2070&auto=format&fit=crop"
                            category="Modern Retail"
                            title="Inventory Berbasis AI"
                            description="Sistem pintar yang memprediksi kebutuhan stok berdasarkan tren penjualan mingguan."
                        />
                        <PhotoCard
                            image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1974&auto=format&fit=crop"
                            category="Fine Dining"
                            title="Kitchen Display System"
                            description="Optimalkan alur kerja dapur dengan integrasi pesanan langsung ke layar koki."
                        />
                    </div>
                </div>
            </section>

            {/* --- FEATURE SHOWCASE --- */}
            <section id="fitur" className="py-24 lg:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter italic uppercase leading-none mb-6 text-zinc-900">
                            FITUR <span className="text-[#FEB400]">SUPER</span> KILATZ.
                        </h2>
                        <p className="text-lg text-zinc-500 font-medium">
                            Semua alat yang Anda butuhkan untuk mengoperasikan, mengelola, dan mengembangkan bisnis dengan kecepatan cahaya.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Zap size={32} className="text-[#FEB400] mb-6" />,
                                title: "Lightning Fast",
                                desc: "Proses transaksi kurang dari 1 detik. Jangan biarkan pelanggan Anda menunggu."
                            },
                            {
                                icon: <BarChart3 size={32} className="text-[#FEB400] mb-6" />,
                                title: "Real-time Analytics",
                                desc: "Pantau penjualan, stok, dan performa staff secara langsung dari perangkat apa pun."
                            },
                            {
                                icon: <Smartphone size={32} className="text-[#FEB400] mb-6" />,
                                title: "Mobile & Offline",
                                desc: "Aplikasi tetap berjalan mulus meskipun tanpa koneksi internet. Sinkronisasi otomatis saat online."
                            },
                            {
                                icon: <ShieldCheck size={32} className="text-[#FEB400] mb-6" />,
                                title: "Enterprise Security",
                                desc: "Keamanan tingkat bank dengan verifikasi OTP terintegrasi E-Signa dan enkripsi data end-to-end."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-zinc-50 rounded-[2rem] p-8 border border-zinc-100 hover:border-[#FEB400]/30 transition-colors group">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-black tracking-tight text-zinc-900 mb-3">{feature.title}</h3>
                                <p className="text-zinc-500 font-medium text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING TABLE --- */}
            <section id="pricing" className="py-24 lg:py-32 bg-zinc-900 text-white selection:bg-[#FEB400] selection:text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter italic uppercase leading-none mb-6">
                            INVESTASI <span className="text-[#FEB400]">TERBAIK</span>.
                        </h2>
                        <p className="text-lg text-zinc-400 font-medium">
                            Pilih paket yang sesuai dengan skala bisnis Anda. Tidak ada biaya tersembunyi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Basic Plan */}
                        <div className="bg-zinc-800 rounded-[2.5rem] p-10 border border-zinc-700 flex flex-col">
                            <h3 className="text-2xl font-black mb-2">Basic</h3>
                            <p className="text-zinc-400 text-sm mb-8 font-medium">Cocok untuk usaha kecil atau kedai tunggal yang baru mulai.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black tracking-tighter">Rp 99K</span>
                                <span className="text-zinc-400 font-medium">/bulan</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['1 Outlet / Cabang', 'Max 500 Transaksi / bln', 'Support Email', 'Analisis Standar'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                                            <Zap size={12} className="text-zinc-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register" className="w-full bg-zinc-700 text-white py-4 rounded-full font-black text-center hover:bg-zinc-600 transition-colors">
                                PILIH BASIC
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-white rounded-[2.5rem] p-10 border-[8px] border-[#FEB400]/20 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FEB400] text-zinc-900 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">
                                Paling Populer
                            </div>
                            <h3 className="text-2xl font-black mb-2 text-zinc-900">Pro</h3>
                            <p className="text-zinc-500 text-sm mb-8 font-medium">Fokus pada pertumbuhan cepat dan manajemen multi-cabang.</p>
                            <div className="mb-8 text-zinc-900">
                                <span className="text-5xl font-black tracking-tighter">Rp 299K</span>
                                <span className="text-zinc-500 font-medium">/bulan</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['Hingga 5 Outlet', 'Transaksi Unlimited', 'Manajemen Staff/Kasir', 'Kitchen Display System (KDS)', 'Support Priority 24/7'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-[#FEB400]/20 flex items-center justify-center">
                                            <Zap size={12} className="text-[#FEB400] fill-current" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/register" className="w-full bg-zinc-900 text-white py-4 rounded-full font-black text-center hover:bg-zinc-800 transition-colors shadow-xl">
                                PILIH PRO
                            </Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-zinc-800 rounded-[2.5rem] p-10 border border-zinc-700 flex flex-col">
                            <h3 className="text-2xl font-black mb-2">Enterprise</h3>
                            <p className="text-zinc-400 text-sm mb-8 font-medium">Skala besar dengan kebutuhan integrasi API kustom.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black tracking-tighter">Custom</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-1">
                                {['Outlet Tidak Terbatas', 'API & Webhook Access', 'Dedicated Account Manager', 'Custom Development'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                                            <Zap size={12} className="text-zinc-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full bg-zinc-700 text-white py-4 rounded-full font-black text-center hover:bg-zinc-600 transition-colors">
                                HUBUNGI SALES
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24 lg:py-32 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="bg-[#FEB400] rounded-[4rem] p-12 lg:p-24 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl shadow-yellow-500/30">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <Zap size={500} className="absolute -top-32 -left-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
                            <h2 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none text-zinc-900">
                                SIAP MELUNCUR <br /> BERSAMA <span className="text-white">KILATZ?</span>
                            </h2>
                        </div>
                        <div className="relative z-10 flex flex-col gap-4 w-full lg:w-auto">
                            <Link href="/register" className="bg-zinc-800 text-white px-12 py-6 rounded-full font-black text-xl hover:bg-zinc-900 hover:scale-105 transition-all shadow-2xl tracking-widest uppercase text-center">
                                GET STARTED NOW
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
