<?php

namespace App\Filament\Resources\TenantKycs\Schemas;

use App\Support\BankList;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TenantKycForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Group::make()
                    ->schema([
                        Section::make('Identitas Tenant / Outlet')
                            ->description('Informasi outlet dan status kepemilikan bisnis.')
                            ->schema([
                                Select::make('tenant_id')
                                    ->label('Tenant / Outlet')
                                    ->relationship('tenant', 'business_name')
                                    ->searchable()
                                    ->preload()
                                    ->required()
                                    ->disabled(fn ($record) => $record !== null),

                                TextInput::make('business_type')
                                    ->label('Kategori / Jenis Usaha')
                                    ->placeholder('Contoh: Cafe & Resto, FnB, Retail')
                                    ->maxLength(100),
                            ])
                            ->columns(2),

                        Section::make('Data KTP & Verifikasi Identitas')
                            ->description('Foto KTP dan data kependudukan pemilik usaha.')
                            ->schema([
                                TextInput::make('id_card_number')
                                    ->label('Nomor Induk Kependudukan (NIK KTP)')
                                    ->required()
                                    ->numeric()
                                    ->length(16)
                                    ->placeholder('16 digit NIK KTP'),

                                TextInput::make('id_card_name')
                                    ->label('Nama Lengkap (Sesuai KTP)')
                                    ->required()
                                    ->maxLength(150),

                                FileUpload::make('id_card_photo_path')
                                    ->label('Foto KTP Asli')
                                    ->disk('public')
                                    ->directory('kyc/ktp')
                                    ->image()
                                    ->imageEditor()
                                    ->openable()
                                    ->downloadable()
                                    ->required()
                                    ->columnSpanFull(),
                            ])
                            ->columns(2),

                        Section::make('Informasi Rekening Bank Pencairan')
                            ->description('Rekening bank penampungan atas nama pemilik / badan usaha.')
                            ->schema([
                                Select::make('bank_name')
                                    ->label('Nama Bank')
                                    ->options(BankList::all())
                                    ->searchable()
                                    ->required(),

                                TextInput::make('bank_account_number')
                                    ->label('Nomor Rekening Bank')
                                    ->required()
                                    ->maxLength(50),

                                TextInput::make('bank_account_holder_name')
                                    ->label('Nama Pemilik Rekening')
                                    ->required()
                                    ->maxLength(150),
                            ])
                            ->columns(3),

                        Section::make('Dokumentasi Tempat Usaha')
                            ->description('Foto fisik tempat usaha / gerai outlet.')
                            ->schema([
                                FileUpload::make('business_photo_path')
                                    ->label('Foto Gerai / Tempat Usaha')
                                    ->disk('public')
                                    ->directory('kyc/business')
                                    ->image()
                                    ->imageEditor()
                                    ->openable()
                                    ->downloadable()
                                    ->required()
                                    ->columnSpanFull(),
                            ]),

                        Section::make('Status Verifikasi & Keputusan Admin')
                            ->description('Tentukan kelayakan tenant untuk mengakses QRIS Dinamis.')
                            ->schema([
                                Select::make('status')
                                    ->label('Status KYC')
                                    ->options([
                                        'pending'  => 'Menunggu Tinjauan (Pending)',
                                        'approved' => 'Disetujui (Approved) - QRIS Aktif',
                                        'rejected' => 'Ditolak (Rejected)',
                                    ])
                                    ->required()
                                    ->default('pending')
                                    ->reactive(),

                                Textarea::make('rejection_reason')
                                    ->label('Alasan Penolakan (Wajib jika ditolak)')
                                    ->rows(3)
                                    ->visible(fn ($get) => $get('status') === 'rejected')
                                    ->required(fn ($get) => $get('status') === 'rejected')
                                    ->columnSpanFull(),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
