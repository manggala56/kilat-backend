<?php

namespace App\Filament\Resources\Tenants\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Schema;

class TenantForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Informasi Bisnis')
                            ->description('Detail informasi bisnis dan toko dari tenant.')
                            ->schema([
                                TextInput::make('business_name')
                                    ->label('Nama Bisnis')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('store_id')
                                    ->label('ID Toko')
                                    ->required()
                                    ->maxLength(255),
                                Select::make('owner_id')
                                    ->relationship('owner', 'name')
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->label('Pemilik (User)')
                                    ->columnSpanFull(),
                                Textarea::make('business_address')
                                    ->label('Alamat Bisnis')
                                    ->columnSpanFull()
                                    ->rows(3),
                            ])
                            ->columns(2),
                    ])
                    ->columnSpan(['lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Pengaturan')
                            ->description('Konfigurasi paket dan status.')
                            ->schema([
                                Select::make('subscription_package_id')
                                    ->label('Paket Langganan')
                                    ->relationship('subscriptionPackage', 'name')
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->native(false),
                                Select::make('status')
                                    ->label('Status')
                                    ->options([
                                        'active' => 'Aktif',
                                        'inactive' => 'Nonaktif',
                                        'suspended' => 'Ditangguhkan',
                                    ])
                                    ->required()
                                    ->default('active')
                                    ->native(false),
                            ]),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}
