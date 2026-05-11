<?php

namespace App\Filament\Resources\AuditLogs\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Group;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class AuditLogForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Detail Aktivitas')
                            ->description('Log aktivitas yang tercatat dalam sistem.')
                            ->schema([
                                Select::make('user_id')
                                    ->label('Pengguna')
                                    ->relationship('user', 'name')
                                    ->searchable()
                                    ->preload()
                                    ->nullable()
                                    ->columnSpanFull(),
                                TextInput::make('action')
                                    ->label('Aksi')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('ip_address')
                                    ->label('Alamat IP')
                                    ->maxLength(45),
                                Textarea::make('description')
                                    ->label('Deskripsi')
                                    ->required()
                                    ->rows(4)
                                    ->columnSpanFull(),
                            ])
                            ->columns(2),
                    ]),
            ]);
    }
}
