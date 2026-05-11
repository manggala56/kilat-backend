import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { 
    TrendingUp, 
    ShoppingCart, 
    Users, 
    Package,
    Filter,
    Download,
    Plus
} from 'lucide-react';

const StatCard = ({ title, value, trend, icon: Icon, description }: any) => (
    <div className="p-7 rounded-[2.5rem] border bg-card text-card-foreground border-border shadow-sm transition-all duration-300 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-6">
            <div className="p-4 rounded-2xl bg-[#FEB400]/10 text-[#FEB400]">
                <Icon size={24} />
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${trend > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                {trend > 0 ? '+' : ''}{trend}%
                <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
            </div>
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {title}
            </p>
            <h3 className="text-3xl font-black tracking-tighter">
                {value}
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground">
                {description}
            </p>
        </div>
    </div>
);

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            
            <div className="flex flex-col gap-8 p-4 md:p-8">
                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                            Business Overview
                        </h1>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                            Live Analytics • Terakhir Update 14:20
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            <Filter size={16} /> Filter
                        </button>
                        <button className="flex items-center gap-3 px-7 py-3 bg-[#FEB400] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all">
                            <Download size={16} /> Export
                        </button>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
                    <StatCard title="Sales Today" value="Rp 12,45 Jt" trend={12.5} icon={TrendingUp} description="Dibandingkan kemarin" />
                    <StatCard title="Orders" value="458" trend={8.2} icon={ShoppingCart} description="Rata-rata 38/jam" />
                    <StatCard title="Active Staff" value="12/15" trend={0} icon={Users} description="Semua cabang aktif" />
                    <StatCard title="Low Stock" value="03" trend={-2.4} icon={Package} description="Item butuh restok" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    {/* TABEL TRANSAKSI TERBARU */}
                    <div className="xl:col-span-2 rounded-[3rem] border border-border p-6 md:p-8 bg-card shadow-sm">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <h3 className="text-xl font-black tracking-tight uppercase italic">Recent Activity</h3>
                            <button className="text-[10px] font-black text-[#FEB400] hover:underline uppercase tracking-widest transition-all">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[500px]">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
                                        <th className="pb-6 px-2">ID</th>
                                        <th className="pb-6 px-2">Customer</th>
                                        <th className="pb-6 px-2">Amount</th>
                                        <th className="pb-6 px-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {[
                                        { id: '#KLT-9921', name: 'Budi Santoso', total: 'Rp 150.000', status: 'Success' },
                                        { id: '#KLT-9920', name: 'Santi Wijaya', total: 'Rp 85.000', status: 'Success' },
                                        { id: '#KLT-9919', name: 'Andi Pratama', total: 'Rp 1.200.000', status: 'Pending' },
                                        { id: '#KLT-9918', name: 'Rina Kartika', total: 'Rp 45.000', status: 'Success' },
                                    ].map((row, i) => (
                                        <tr key={i} className="group cursor-pointer hover:bg-muted/50 transition-colors">
                                            <td className="py-6 px-2 text-sm font-black italic text-muted-foreground group-hover:text-primary">{row.id}</td>
                                            <td className="py-6 px-2 text-sm font-bold text-foreground/80">{row.name}</td>
                                            <td className="py-6 px-2 text-sm font-black">{row.total}</td>
                                            <td className="py-6 px-2 text-right">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${row.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PRODUK TERLARIS */}
                    <div className="rounded-[3rem] border border-border p-8 bg-card shadow-sm">
                        <h3 className="text-xl font-black tracking-tight uppercase italic mb-10">Top Sales</h3>
                        <div className="space-y-10">
                            {[
                                { name: 'Kopi Gula Aren', sales: 145, img: '☕️', percent: 75 },
                                { name: 'Croissant Almond', sales: 89, img: '🥐', percent: 45 },
                                { name: 'Beef Burger', sales: 76, img: '🍔', percent: 38 },
                                { name: 'Matcha Latte', sales: 54, img: '🍵', percent: 25 },
                            ].map((item, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-secondary border border-border shadow-sm">
                                                {item.img}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{item.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.sales} Terjual</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-[#FEB400] italic">{item.percent}%</p>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-secondary">
                                        <div className="h-full bg-[#FEB400] rounded-full shadow-sm" style={{ width: `${item.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-12 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border text-muted-foreground hover:text-primary hover:border-primary">
                            View Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <button className="fixed bottom-8 right-8 md:bottom-10 md:right-10 w-16 h-16 bg-[#FEB400] text-black rounded-3xl shadow-2xl shadow-yellow-500/40 flex items-center justify-center hover:rotate-12 hover:scale-110 transition-all z-50">
                <Plus size={32} strokeWidth={3} />
            </button>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
