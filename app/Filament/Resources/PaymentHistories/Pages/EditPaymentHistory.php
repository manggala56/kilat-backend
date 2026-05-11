<?php

namespace App\Filament\Resources\PaymentHistories\Pages;

use App\Filament\Resources\PaymentHistories\PaymentHistoryResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPaymentHistory extends EditRecord
{
    protected static string $resource = PaymentHistoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
