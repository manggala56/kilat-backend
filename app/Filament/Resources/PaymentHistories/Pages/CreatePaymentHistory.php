<?php

namespace App\Filament\Resources\PaymentHistories\Pages;

use App\Filament\Resources\PaymentHistories\PaymentHistoryResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePaymentHistory extends CreateRecord
{
    protected static string $resource = PaymentHistoryResource::class;
}
