<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Users
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@enricharcane.com',
                'password' => Hash::make('Enrich@1qaz'),
                'role' => 'superadmin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Super+Admin&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Piumi Sam',
                'email' => 'teamsales@enricharcane.com',
                'password' => Hash::make('Password@123'),
                'role' => 'admin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Piumi+Sam&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Sunimal Opatha',
                'email' => 'sunimal@enricharcane.com',
                'password' => Hash::make('Password@123'),
                'role' => 'admin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Sunimal+Opatha&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Lakshitha Sankalpa',
                'email' => 'lakshitha.enrich@gmail.com',
                'password' => Hash::make('Password@123'),
                'role' => 'developer',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Lakshitha+Sankalpa&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Tharindu perera',
                'email' => 'tharindu.enrich@gmail.com',
                'password' => Hash::make('Password@123'),
                'role' => 'developer',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Tharindu+Perera&background=4f46e5&color=fff',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
