import React from 'react';
import { Link } from '@inertiajs/react';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export function Pagination({ links }: PaginationProps) {
    if (!links || links.length <= 3) return null; // Only show pagination if there are actual pages

    return (
        <div className="flex flex-wrap items-center justify-center py-4 gap-1 mt-4">
            {links.map((link, index) => {
                // Determine label based on Laravel's standard strings
                let label = link.label;
                if (label.includes('&laquo;')) label = '«';
                if (label.includes('&raquo;')) label = '»';

                const isPrevious = link.label.includes('Previous');
                const isNext = link.label.includes('Next');

                if (link.url === null) {
                    return (
                        <div
                            key={index}
                            className="px-3 py-1 text-sm text-muted-foreground bg-muted/20 border border-transparent rounded cursor-not-allowed"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        className={`px-3 py-1 text-sm border rounded hover:bg-muted/50 transition-colors ${
                            link.active
                                ? 'bg-[#FEB400] text-black border-[#FEB400] font-medium hover:bg-[#e0a000]'
                                : 'bg-background text-foreground border-border'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                        preserveState
                        preserveScroll
                    />
                );
            })}
        </div>
    );
}
