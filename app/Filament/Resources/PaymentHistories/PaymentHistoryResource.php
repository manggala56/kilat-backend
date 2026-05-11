<?php

namespace App\Filament\Resources\PaymentHistories;

use App\Filament\Resources\PaymentHistories\Pages\CreatePaymentHistory;
use App\Filament\Resources\PaymentHistories\Pages\EditPaymentHistory;
use App\Filament\Resources\PaymentHistories\Pages\ListPaymentHistories;
use App\Filament\Resources\PaymentHistories\Schemas\PaymentHistoryForm;
use App\Filament\Resources\PaymentHistories\Tables\PaymentHistoriesTable;
use App\Models\PaymentHistory;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PaymentHistoryResource extends Resource
{
    protected static ?string $model = PaymentHistory::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBanknotes;

    protected static ?string $navigationLabel = 'Riwayat Pembayaran';

    protected static string|\UnitEnum|null $navigationGroup = 'Keuangan';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'xendit_ref';

    public static function form(Schema $schema): Schema
    {
        return PaymentHistoryForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PaymentHistoriesTable::configure($table);
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
            'index' => ListPaymentHistories::route('/'),
            'create' => CreatePaymentHistory::route('/create'),
            'edit' => EditPaymentHistory::route('/{record}/edit'),
        ];
    }
}
