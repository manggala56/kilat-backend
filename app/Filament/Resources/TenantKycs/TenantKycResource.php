<?php

namespace App\Filament\Resources\TenantKycs;

use App\Filament\Resources\TenantKycs\Pages\CreateTenantKyc;
use App\Filament\Resources\TenantKycs\Pages\EditTenantKyc;
use App\Filament\Resources\TenantKycs\Pages\ListTenantKycs;
use App\Filament\Resources\TenantKycs\Schemas\TenantKycForm;
use App\Filament\Resources\TenantKycs\Tables\TenantKycsTable;
use App\Models\TenantKyc;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TenantKycResource extends Resource
{
    protected static ?string $model = TenantKyc::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShieldCheck;

    protected static ?string $navigationLabel = 'Verifikasi KYC QRIS';

    protected static ?string $modelLabel = 'Verifikasi KYC';

    protected static ?string $pluralModelLabel = 'Verifikasi KYC Tenant';

    protected static string|\UnitEnum|null $navigationGroup = 'Manajemen Tenant';

    protected static ?int $navigationSort = 3;

    public static function getNavigationBadge(): ?string
    {
        $pendingCount = TenantKyc::where('status', 'pending')->count();
        return $pendingCount > 0 ? (string) $pendingCount : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Schema $schema): Schema
    {
        return TenantKycForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TenantKycsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTenantKycs::route('/'),
            'create' => CreateTenantKyc::route('/create'),
            'edit' => EditTenantKyc::route('/{record}/edit'),
        ];
    }
}
