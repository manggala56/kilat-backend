<?php

namespace App\Filament\Resources\PaymentHistories\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PaymentHistoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('tenant_id')
                    ->required()
                    ->numeric(),
                TextInput::make('xendit_ref')
                    ->required(),
                TextInput::make('amount')
                    ->required()
                    ->numeric(),
                TextInput::make('payment_method'),
                TextInput::make('status')
                    ->required()
                    ->default('pending'),
                DateTimePicker::make('paid_at'),
            ]);
    }
}
