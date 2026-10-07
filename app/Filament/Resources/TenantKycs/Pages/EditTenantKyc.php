<?php

namespace App\Filament\Resources\TenantKycs\Pages;

use App\Filament\Resources\TenantKycs\TenantKycResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTenantKyc extends EditRecord
{
    protected static string $resource = TenantKycResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
