<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $addresses = [
            [
                'email' => 'cliente1@rockerstore.test',
                'recipient_name' => 'Cliente Teste 1',
                'zip_code' => '85010-000',
                'street' => 'Rua Exemplo Um',
                'number' => '100',
                'complement' => 'Casa',
                'district' => 'Centro',
                'city' => 'Guarapuava',
                'state' => 'PR',
            ],
            [
                'email' => 'cliente2@rockerstore.test',
                'recipient_name' => 'Cliente Teste 2',
                'zip_code' => '80010-000',
                'street' => 'Rua Exemplo Dois',
                'number' => '200',
                'complement' => 'Apartamento 12',
                'district' => 'Centro',
                'city' => 'Curitiba',
                'state' => 'PR',
            ],
            [
                'email' => 'cliente3@rockerstore.test',
                'recipient_name' => 'Cliente Teste 3',
                'zip_code' => '01001-000',
                'street' => 'Rua Exemplo Tres',
                'number' => '300',
                'complement' => null,
                'district' => 'Centro',
                'city' => 'Sao Paulo',
                'state' => 'SP',
            ],
        ];

        foreach ($addresses as $data) {
            $user = DB::table('users')
                ->where('email', $data['email'])
                ->first();

            if (!$user) {
                throw new RuntimeException(
                    "Usuário não encontrado: {$data['email']}"
                );
            }

            DB::table('addresses')->updateOrInsert(
                [
                    'user_id' => $user->id,
                    'zip_code' => $data['zip_code'],
                ],
                [
                    'recipient_name' => $data['recipient_name'],
                    'street' => $data['street'],
                    'number' => $data['number'],
                    'complement' => $data['complement'],
                    'district' => $data['district'],
                    'city' => $data['city'],
                    'state' => $data['state'],
                    'updated_at' => now(),
                ]
            );
        }
    }
}
