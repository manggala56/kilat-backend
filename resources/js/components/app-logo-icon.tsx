import { Zap } from 'lucide-react';

export default function AppLogoIcon({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center rounded-2xl bg-[#FEB400] shadow-lg shadow-yellow-500/30 ${className}`}>
            <Zap className="text-black fill-current" size={20} />
        </div>
    );
}
