<?php

namespace App\Filament\Resources\TenantKycs\Tables;

use App\Models\TenantKyc;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Notifications\Notification;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TenantKycsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tenant.business_name')
                    ->label('Tenant / Outlet')
                    ->searchable()
                    ->sortable()
                    ->description(fn (TenantKyc $record): string => 'Owner: ' . ($record->tenant->owner->name ?? '-')),

                ImageColumn::make('id_card_photo_path')
                    ->label('KTP')
                    ->disk('public')
                    ->circular(false)
                    ->square(),

                ImageColumn::make('business_photo_path')
                    ->label('Foto Usaha')
                    ->disk('public')
                    ->circular(false)
                    ->square(),

                TextColumn::make('id_card_number')
                    ->label('NIK KTP')
                    ->searchable()
                    ->description(fn (TenantKyc $record): string => $record->id_card_name),

                TextColumn::make('bank_name')
                    ->label('Rekening Bank')
                    ->formatStateUsing(fn ($state, TenantKyc $record) => $record->bank_label . ' - ' . $record->bank_account_number)
                    ->description(fn (TenantKyc $record): string => 'a/n ' . $record->bank_account_holder_name)
                    ->searchable(),

                TextColumn::make('status')
                    ->label('Status QRIS')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'rejected' => 'danger',
                        'pending'  => 'warning',
                        default    => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'approved' => 'Disetujui (Aktif)',
                        'rejected' => 'Ditolak',
                        'pending'  => 'Menunggu Review',
                        default    => 'Draft',
                    }),

                TextColumn::make('created_at')
                    ->label('Diajukan')
                    ->dateTime('d M Y, H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status Verifikasi')
                    ->options([
                        'pending'  => 'Menunggu Review (Pending)',
                        'approved' => 'Disetujui (Approved)',
                        'rejected' => 'Ditolak (Rejected)',
                    ]),
            ])
            ->recordActions([
                Action::make('approve')
                    ->label('Setujui')
                    ->icon(Heroicon::OutlinedCheckCircle)
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Setujui Verifikasi KYC')
                    ->modalDescription('Apakah Anda yakin data KTP, Bank, dan Foto Usaha tenant ini valid? Setelah disetujui, QRIS Dinamis akan langsung aktif.')
                    ->action(function (TenantKyc $record) {
                        $record->update([
                            'status'           => 'approved',
                            'rejection_reason' => null,
                            'verified_at'      => now(),
                            'verified_by'      => auth()->id(),
                        ]);

                        Notification::make()
                            ->title('KYC Berhasil Disetujui')
                            ->body("QRIS Dinamis untuk tenant {$record->tenant->business_name} telah aktif.")
                            ->success()
                            ->send();
                    })
                    ->visible(fn (TenantKyc $record) => $record->status !== 'approved'),

                Action::make('reject')
                    ->label('Tolak')
                    ->icon(Heroicon::OutlinedXCircle)
                    ->color('danger')
                    ->form([
                        Textarea::make('rejection_reason')
                            ->label('Alasan Penolakan')
                            ->placeholder('Jelaskan mengapa dokumen ditolak (misal: foto KTP buram, nama tidak sesuai rek bank)')
                            ->required()
                            ->rows(3),
                    ])
                    ->action(function (TenantKyc $record, array $data) {
                        $record->update([
                            'status'           => 'rejected',
                            'rejection_reason' => $data['rejection_reason'],
                            'verified_at'      => now(),
                            'verified_by'      => auth()->id(),
                        ]);

                        Notification::make()
                            ->title('KYC Telah Ditolak')
                            ->body("Permohonan KYC tenant {$record->tenant->business_name} telah ditolak.")
                            ->danger()
                            ->send();
                    })
                    ->visible(fn (TenantKyc $record) => $record->status !== 'rejected'),

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
