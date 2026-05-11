<?php

namespace App\Filament\Widgets;

use App\Models\Tenant;
use App\Models\PaymentHistory;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class CommandDashboardWidget extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Tenant Aktif', Tenant::where('status', 'active')->count())
                ->description('Jumlah toko yang sedang aktif')
                ->descriptionIcon('heroicon-m-check-badge')
                ->color('success'),
                
            Stat::make('Pendapatan Bulanan', 'Rp ' . number_format(PaymentHistory::where('status', 'paid')->whereMonth('paid_at', now()->month)->sum('amount'), 0, ',', '.'))
                ->description('Total dari subscription bulan ini')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('primary'),
                
            Stat::make('Server Uptime', '99.98%')
                ->description('AWS Cloud Infrastructure')
                ->descriptionIcon('heroicon-m-server')
                ->color('success'),
                
            Stat::make('Latency API', '42ms')
                ->description('Average response time')
                ->descriptionIcon('heroicon-m-bolt')
                ->color('warning'),
        ];
    }
}
