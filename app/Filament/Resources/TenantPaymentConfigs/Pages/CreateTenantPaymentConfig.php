<?php

namespace App\Filament\Resources\TenantPaymentConfigs\Pages;

use App\Filament\Resources\TenantPaymentConfigs\TenantPaymentConfigResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTenantPaymentConfig extends CreateRecord
{
    protected static string $resource = TenantPaymentConfigResource::class;
}
