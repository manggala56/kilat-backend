<?php

namespace App\Filament\Resources\TenantPaymentConfigs\Pages;

use App\Filament\Resources\TenantPaymentConfigs\TenantPaymentConfigResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTenantPaymentConfig extends EditRecord
{
    protected static string $resource = TenantPaymentConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
