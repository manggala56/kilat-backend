<?php

namespace App\Filament\Resources\TenantPaymentConfigs;

use App\Filament\Resources\TenantPaymentConfigs\Pages\CreateTenantPaymentConfig;
use App\Filament\Resources\TenantPaymentConfigs\Pages\EditTenantPaymentConfig;
use App\Filament\Resources\TenantPaymentConfigs\Pages\ListTenantPaymentConfigs;
use App\Filament\Resources\TenantPaymentConfigs\Schemas\TenantPaymentConfigForm;
use App\Filament\Resources\TenantPaymentConfigs\Tables\TenantPaymentConfigsTable;
use App\Models\TenantPaymentConfig;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TenantPaymentConfigResource extends Resource
{
    protected static ?string $model = TenantPaymentConfig::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBanknotes;

    protected static ?string $navigationLabel = 'Konfigurasi Fee & Split';

    protected static ?string $modelLabel = 'Pengaturan Fee & Split';

    protected static ?string $pluralModelLabel = 'Pengaturan Fee & Split Pembayaran';

    protected static string|\UnitEnum|null $navigationGroup = 'Manajemen Tenant';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return TenantPaymentConfigForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TenantPaymentConfigsTable::configure($table);
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
            'index' => ListTenantPaymentConfigs::route('/'),
            'create' => CreateTenantPaymentConfig::route('/create'),
            'edit' => EditTenantPaymentConfig::route('/{record}/edit'),
        ];
    }
}
