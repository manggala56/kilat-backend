<?php

namespace App\Filament\Resources\SubscriptionPackages\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Group;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SubscriptionPackageForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Detail Paket')
                            ->description('Informasi nama dan deskripsi paket langganan.')
                            ->schema([
                                TextInput::make('name')
                                    ->label('Nama Paket')
                                    ->required()
                                    ->maxLength(255)
                                    ->columnSpanFull(),
                                Textarea::make('description')
                                    ->label('Deskripsi')
                                    ->rows(3)
                                    ->columnSpanFull(),
                            ]),
                    ])
                    ->columnSpan(['lg' => 2]),

                Group::make()
                    ->schema([
                        Section::make('Harga & Durasi')
                            ->schema([
                                TextInput::make('price')
                                    ->label('Harga')
                                    ->required()
                                    ->numeric()
                                    ->default(0)
                                    ->prefix('Rp')
                                    ->minValue(0),
                                TextInput::make('duration_in_days')
                                    ->label('Durasi (Hari)')
                                    ->required()
                                    ->numeric()
                                    ->default(30)
                                    ->minValue(1)
                                    ->suffix('hari'),
                            ]),
                        Section::make('Status')
                            ->schema([
                                Toggle::make('is_active')
                                    ->label('Paket Aktif')
                                    ->default(true),
                            ]),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
    }
}
