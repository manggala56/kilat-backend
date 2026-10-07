<?php

namespace App\Filament\Resources\TenantPaymentConfigs\Pages;

use App\Filament\Resources\TenantPaymentConfigs\TenantPaymentConfigResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTenantPaymentConfigs extends ListRecords
{
    protected static string $resource = TenantPaymentConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
