<?php

namespace App\Filament\Resources\TenantKycs\Pages;

use App\Filament\Resources\TenantKycs\TenantKycResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTenantKycs extends ListRecords
{
    protected static string $resource = TenantKycResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
