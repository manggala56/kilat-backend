<?php

namespace App\Filament\Resources\Coupons\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class CouponsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->label('Kode Kupon')
                    ->searchable()
                    ->copyable()
                    ->badge()
                    ->color('gray')
                    ->fontFamily('mono'),
                TextColumn::make('type')
                    ->label('Tipe')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'discount' => 'warning',
                        'penjualan' => 'info',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'discount' => 'Diskon',
                        'penjualan' => 'Penjualan',
                        default => $state,
                    }),
                TextColumn::make('discount_percentage')
                    ->label('Diskon (%)')
                    ->numeric()
                    ->suffix('%')
                    ->sortable()
                    ->placeholder('—'),
                TextColumn::make('sales.name')
                    ->label('Sales')
                    ->searchable()
                    ->placeholder('—'),
                TextColumn::make('subscriptionPackage.name')
                    ->label('Paket')
                    ->badge()
                    ->color('primary')
                    ->placeholder('—'),
                TextColumn::make('duration_in_days')
                    ->label('Durasi (Hari)')
                    ->numeric()
                    ->suffix(' hari')
                    ->placeholder('—'),
                TextColumn::make('used_count')
                    ->label('Digunakan')
                    ->numeric()
                    ->sortable(),
                IconColumn::make('is_active')
                    ->label('Aktif')
                    ->boolean(),
                TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime('d M Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->label('Tipe Kupon')
                    ->options([
                        'discount' => 'Diskon',
                        'penjualan' => 'Penjualan',
                    ]),
                TernaryFilter::make('is_active')
                    ->label('Status Aktif'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
