<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = config('rockerstore.seed_password');

        if (empty($password)) {
            throw new RuntimeException(
                'Configure ROCKERSTORE_SEED_PASSWORD no arquivo .env.'
            );
        }

        $users = [
            [
                'name' => 'Administrador RockerStore',
                'email' => 'admin@rockerstore.test',
                'role' => 'admin',
            ],
            [
                'name' => 'Cliente Teste 1',
                'email' => 'cliente1@rockerstore.test',
                'role' => 'cliente',
            ],
            [
                'name' => 'Cliente Teste 2',
                'email' => 'cliente2@rockerstore.test',
                'role' => 'cliente',
            ],
            [
                'name' => 'Cliente Teste 3',
                'email' => 'cliente3@rockerstore.test',
                'role' => 'cliente',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => $password,
                    'role' => $user['role'],
                ]
            );
        }
    }
}
