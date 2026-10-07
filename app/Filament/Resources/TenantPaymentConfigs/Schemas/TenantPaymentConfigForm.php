<?php

namespace App\Filament\Resources\TenantPaymentConfigs\Schemas;

use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TenantPaymentConfigForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Identitas Tenant & DOKU')
                            ->description('Hubungkan tenant dengan rekening penampungan DOKU untuk split payout.')
                            ->schema([
                                Select::make('tenant_id')
                                    ->label('Tenant / Outlet')
                                    ->relationship('tenant', 'business_name')
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->columnSpanFull(),

                                TextInput::make('doku_settlement_bank_account_id')
                                    ->label('DOKU Settlement Bank Account (SBA ID)')
                                    ->placeholder('Contoh: SBA-1234567890')
                                    ->helperText('ID rekening penampungan outlet dari dashboard DOKU Back Office.')
                                    ->maxLength(100),

                                Toggle::make('is_split_active')
                                    ->label('Aktifkan Split Settlement Otomatis')
                                    ->helperText('Jika nonaktif, seluruh nominal dialokasikan ke akun utama platform.')
                                    ->default(true),
                            ])
                            ->columns(2),

                        Section::make('Konfigurasi Komisi & Potongan Platform')
                            ->description('Tentukan formula pembagian komisi Kilatz terhadap omzet tenant.')
                            ->schema([
                                Select::make('fee_type')
                                    ->label('Skema Tarif Fee')
                                    ->options([
                                        'fixed'      => 'Nominal Flat / Tetap (Rp)',
                                        'percentage' => 'Persentase Murni (%)',
                                        'hybrid'     => 'Hybrid (Nominal Flat + %)',
                                        'multiple'   => 'Kelipatan Nominal (Step-based)',
                                        'tiered'     => 'Berjenjang (Tiered Rules)',
                                    ])
                                    ->required()
                                    ->default('fixed')
                                    ->reactive(),

                                TextInput::make('platform_fee_fixed')
                                    ->label('Nominal Flat / Tetap')
                                    ->prefix('Rp')
                                    ->numeric()
                                    ->default(0)
                                    ->visible(fn ($get) => in_array($get('fee_type'), ['fixed', 'hybrid', 'multiple'])),

                                TextInput::make('platform_fee_percent')
                                    ->label('Persentase Komisi')
                                    ->suffix('%')
                                    ->numeric()
                                    ->default(0)
                                    ->visible(fn ($get) => in_array($get('fee_type'), ['percentage', 'hybrid', 'multiple'])),

                                Group::make()
                                    ->schema([
                                        TextInput::make('fee_multiple_step')
                                            ->label('Basis Kelipatan Transaksi')
                                            ->prefix('Rp')
                                            ->numeric()
                                            ->default(50000)
                                            ->helperText('Misal: Rp 50.000'),

                                        TextInput::make('fee_multiple_amount')
                                            ->label('Biaya per Kelipatan')
                                            ->prefix('Rp')
                                            ->numeric()
                                            ->default(500)
                                            ->helperText('Misal: Rp 500 per kelipatan'),
                                    ])
                                    ->visible(fn ($get) => $get('fee_type') === 'multiple')
                                    ->columns(2)
                                    ->columnSpanFull(),

                                Repeater::make('fee_tiers')
                                    ->label('Aturan Komisi Berjenjang (Tiers)')
                                    ->schema([
                                        TextInput::make('min_amount')
                                            ->label('Min. Nominal (Rp)')
                                            ->numeric()
                                            ->required()
                                            ->default(0),

                                        TextInput::make('max_amount')
                                            ->label('Maks. Nominal (Rp)')
                                            ->numeric()
                                            ->nullable()
                                            ->placeholder('Tak terhingga'),

                                        Select::make('fee_type')
                                            ->label('Tipe')
                                            ->options([
                                                'fixed'      => 'Flat (Rp)',
                                                'percentage' => 'Persen (%)',
                                                'hybrid'     => 'Hybrid (Rp + %)',
                                            ])
                                            ->default('fixed')
                                            ->required(),

                                        TextInput::make('fixed_amount')
                                            ->label('Nominal Flat (Rp)')
                                            ->numeric()
                                            ->default(0),

                                        TextInput::make('percent')
                                            ->label('Persen (%)')
                                            ->numeric()
                                            ->default(0),
                                    ])
                                    ->columns(5)
                                    ->columnSpanFull()
                                    ->visible(fn ($get) => $get('fee_type') === 'tiered')
                                    ->default([
                                        ['min_amount' => 0, 'max_amount' => 100000, 'fee_type' => 'fixed', 'fixed_amount' => 1000, 'percent' => 0],
                                        ['min_amount' => 100001, 'max_amount' => 500000, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 1.0],
                                        ['min_amount' => 500001, 'max_amount' => null, 'fee_type' => 'percentage', 'fixed_amount' => 0, 'percent' => 0.8],
                                    ]),
                            ])
                            ->columns(2),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
