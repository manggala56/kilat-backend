<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => 'password',
        ]);
        $admin->assignRole('admin');
        $owner = User::create([
            'name' => 'Owner',
            'email' => 'owner@gmail.com',
            'password' => 'password',
        ]);
        $owner->assignRole('owner');
        $cashier = User::create([
            'name' => 'Cashier',
            'email' => 'cashier@gmail.com',
            'password' => 'password',
        ]);
        $cashier->assignRole('cashier');
    }
}
