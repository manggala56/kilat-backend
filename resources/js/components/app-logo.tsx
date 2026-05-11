import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-9" />
            <div className="ml-1.5 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-black tracking-tighter italic text-foreground text-lg">
                    KILATZ<span className="text-[#FEB400]">.</span>
                </span>
            </div>
        </>
    );
}
