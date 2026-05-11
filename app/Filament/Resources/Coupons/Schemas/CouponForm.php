<?php

namespace App\Filament\Resources\Coupons\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class CouponForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                \Filament\Forms\Components\Section::make('Informasi Kupon')
                    ->schema([
                        \Filament\Forms\Components\Select::make('type')
                            ->label('Tipe Kupon')
                            ->options([
                                'discount' => 'Diskon Biasa',
                                'penjualan' => 'Penjualan (Sales)',
                            ])
                            ->required()
                            ->default('discount')
                            ->live(),

                        \Filament\Forms\Components\TextInput::make('code')
                            ->label('Kode Kupon')
                            ->required()
                            ->default(fn () => \Illuminate\Support\Str::random(8))
                            ->unique(ignoreRecord: true),

                        \Filament\Forms\Components\Toggle::make('is_active')
                            ->label('Aktif')
                            ->default(true),
                    ])->columns(3),

                \Filament\Forms\Components\Section::make('Detail Diskon')
                    ->schema([
                        \Filament\Forms\Components\TextInput::make('discount_percentage')
                            ->label('Persentase Diskon (%)')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(100),
                    ])
                    ->visible(fn (\Filament\Forms\Get $get) => $get('type') === 'discount'),

                \Filament\Forms\Components\Section::make('Detail Penjualan')
                    ->schema([
                        \Filament\Forms\Components\Select::make('sales_id')
                            ->label('Sales (User)')
                            ->relationship('sales', 'name')
                            ->searchable()
                            ->preload()
                            ->required(fn (\Filament\Forms\Get $get) => $get('type') === 'penjualan'),

                        \Filament\Forms\Components\Select::make('subscription_package_id')
                            ->label('Paket Langganan')
                            ->relationship('subscriptionPackage', 'name')
                            ->searchable()
                            ->preload()
                            ->required(fn (\Filament\Forms\Get $get) => $get('type') === 'penjualan'),

                        \Filament\Forms\Components\TextInput::make('duration_in_days')
                            ->label('Durasi (Hari)')
                            ->numeric()
                            ->required(fn (\Filament\Forms\Get $get) => $get('type') === 'penjualan')
                            ->default(30),
                    ])
                    ->columns(3)
                    ->visible(fn (\Filament\Forms\Get $get) => $get('type') === 'penjualan'),

                \Filament\Forms\Components\Section::make('Statistik Penggunaan')
                    ->schema([
                        \Filament\Forms\Components\TextInput::make('used_count')
                            ->label('Jumlah Digunakan')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->disabled(),
                    ]),
            ]);
    }
}
