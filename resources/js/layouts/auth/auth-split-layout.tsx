import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex dark:border-r overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute -inset-[100%] bg-gradient-to-tr from-[#FEB400]/20 to-transparent opacity-50 blur-3xl" />
                
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-xl font-black italic tracking-tighter"
                >
                    <div className="w-8 h-8 bg-[#FEB400] rounded-xl flex items-center justify-center shadow-lg mr-3">
                        <AppLogoIcon className="size-5 fill-current text-black" />
                    </div>
                    KILATZ<span className="text-[#FEB400]">.</span>
                </Link>
                
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed italic text-zinc-200">
                            "Mendaftar di Kilatz adalah keputusan terbaik untuk bisnis saya. Prosesnya kurang dari 2 menit dan sistem langsung bisa dipakai."
                        </p>
                        <footer className="text-sm font-bold text-[#FEB400]">
                            — Owner, Kopi Kenangan
                        </footer>
                    </blockquote>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-black sm:h-12" />
                    </Link>
                    {(title || description) && (
                        <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                            {title && <h1 className="text-xl font-medium">{title}</h1>}
                            {description && (
                                <p className="text-sm text-balance text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
