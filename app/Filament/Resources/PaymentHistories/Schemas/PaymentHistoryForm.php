<?php

namespace App\Filament\Resources\PaymentHistories\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Group;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PaymentHistoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Detail Pembayaran')
                            ->description('Informasi transaksi pembayaran tenant.')
                            ->schema([
                                Select::make('tenant_id')
                                    ->label('Tenant')
                                    ->relationship('tenant', 'business_name')
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->columnSpanFull(),
                                TextInput::make('xendit_ref')
                                    ->label('Referensi Xendit')
                                    ->required()
                                    ->maxLength(255)
                                    ->columnSpanFull(),
                                TextInput::make('amount')
                                    ->label('Nominal')
                                    ->required()
                                    ->numeric()
                                    ->prefix('Rp')
                                    ->minValue(0),
                                TextInput::make('payment_method')
                                    ->label('Metode Bayar'),
                            ])
                            ->columns(2),
                    ])
                    ->columnSpan(['lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Status & Waktu')
                            ->schema([
                                Select::make('status')
                                    ->label('Status')
                                    ->options([
                                        'pending' => 'Menunggu',
                                        'paid' => 'Dibayar',
                                        'failed' => 'Gagal',
                                    ])
                                    ->required()
                                    ->default('pending')
                                    ->native(false),
                                DateTimePicker::make('paid_at')
                                    ->label('Waktu Dibayar'),
                            ]),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}
