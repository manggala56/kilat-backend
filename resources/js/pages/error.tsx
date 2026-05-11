import { Head, Link } from '@inertiajs/react';
import { Zap, AlertTriangle, Home } from 'lucide-react';

export default function ErrorPage({ status }: { status: number }) {
    const title = {
        503: '503: Service Unavailable',
        500: '500: Server Error',
        404: '404: Page Not Found',
        403: '403: Forbidden',
    }[status] || 'Error';

    const description = {
        503: 'Sorry, we are doing some maintenance. Please check back soon.',
        500: 'Whoops, something went wrong on our servers.',
        404: 'Sorry, the page you are looking for could not be found.',
        403: 'Sorry, you are forbidden from accessing this page.',
    }[status] || 'An unexpected error occurred.';

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
            <Head title={title} />
            <div className="max-w-md w-full space-y-8 relative">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FEB400]/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#FEB400] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-yellow-500/30 mb-8 animate-bounce">
                        {status === 404 ? (
                            <Zap className="text-black fill-current" size={40} />
                        ) : (
                            <AlertTriangle className="text-black" size={40} />
                        )}
                    </div>
                    
                    <h1 className="text-7xl font-black italic tracking-tighter text-white mb-4">
                        {status}
                    </h1>
                    <h2 className="text-2xl font-bold tracking-tight text-[#FEB400] uppercase mb-4">
                        {title.split(': ')[1]}
                    </h2>
                    <p className="text-zinc-400 font-medium mb-10">
                        {description}
                    </p>
                    
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:bg-zinc-200 hover:scale-105 transition-all shadow-xl"
                    >
                        <Home size={18} /> Back to Home
                    </Link>
                </div>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">
                    KILATZ SYSTEM CORE
                </p>
            </div>
        </div>
    );
}
