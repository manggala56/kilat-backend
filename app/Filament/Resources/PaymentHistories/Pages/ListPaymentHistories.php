<?php

namespace App\Filament\Resources\PaymentHistories\Pages;

use App\Filament\Resources\PaymentHistories\PaymentHistoryResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPaymentHistories extends ListRecords
{
    protected static string $resource = PaymentHistoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
