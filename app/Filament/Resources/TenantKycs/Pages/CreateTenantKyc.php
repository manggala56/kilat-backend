<?php

namespace App\Filament\Resources\TenantKycs\Pages;

use App\Filament\Resources\TenantKycs\TenantKycResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTenantKyc extends CreateRecord
{
    protected static string $resource = TenantKycResource::class;
}
