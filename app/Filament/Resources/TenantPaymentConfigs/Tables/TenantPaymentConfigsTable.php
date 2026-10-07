<?php

namespace App\Filament\Resources\TenantPaymentConfigs\Tables;

use App\Models\TenantPaymentConfig;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TenantPaymentConfigsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tenant.business_name')
                    ->label('Nama Tenant / Outlet')
                    ->searchable()
                    ->sortable()
                    ->description(fn (TenantPaymentConfig $record): string => 'Store ID: ' . ($record->tenant->store_id ?? '-')),

                TextColumn::make('doku_settlement_bank_account_id')
                    ->label('DOKU SBA ID')
                    ->searchable()
                    ->copyable()
                    ->badge()
                    ->color('gray')
                    ->placeholder('Belum diatur'),

                TextColumn::make('fee_type')
                    ->label('Skema Fee')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'tiered'     => 'warning',
                        'hybrid'     => 'primary',
                        'percentage' => 'info',
                        'multiple'   => 'purple',
                        default      => 'success',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'tiered'     => 'Berjenjang (Tiered)',
                        'hybrid'     => 'Hybrid (Flat + %)',
                        'percentage' => 'Persen (%)',
                        'multiple'   => 'Kelipatan',
                        default      => 'Nominal Flat',
                    }),

                TextColumn::make('summary_fee')
                    ->label('Detail Tarif')
                    ->state(function (TenantPaymentConfig $record): string {
                        if ($record->fee_type === 'fixed') {
                            return 'Rp ' . number_format($record->platform_fee_fixed, 0, ',', '.');
                        } elseif ($record->fee_type === 'percentage') {
                            return $record->platform_fee_percent . '%';
                        } elseif ($record->fee_type === 'hybrid') {
                            return 'Rp ' . number_format($record->platform_fee_fixed, 0, ',', '.') . ' + ' . $record->platform_fee_percent . '%';
                        } elseif ($record->fee_type === 'multiple') {
                            return 'Rp ' . number_format($record->fee_multiple_amount, 0, ',', '.') . ' / Rp ' . number_format($record->fee_multiple_step, 0, ',', '.');
                        } elseif ($record->fee_type === 'tiered') {
                            $count = is_array($record->fee_tiers) ? count($record->fee_tiers) : 0;
                            return "{$count} Tingkat Aturan";
                        }
                        return '-';
                    }),

                IconColumn::make('is_split_active')
                    ->label('Split Aktif')
                    ->boolean(),

                TextColumn::make('updated_at')
                    ->label('Terakhir Diubah')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('fee_type')
                    ->label('Tipe Skema Fee')
                    ->options([
                        'fixed'      => 'Nominal Flat',
                        'percentage' => 'Persentase Murni',
                        'hybrid'     => 'Hybrid',
                        'multiple'   => 'Kelipatan Nominal',
                        'tiered'     => 'Berjenjang (Tiered)',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('updated_at', 'desc');
    }
}
