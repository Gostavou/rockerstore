<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $customerCarts = [
            [
                'email' => 'cliente1@rockerstore.test',
                'items' => [
                    'Guitarra Stratocaster Classic' => 1,
                    'Baixo Precision Classic' => 1,
                ],
            ],
            [
                'email' => 'cliente2@rockerstore.test',
                'items' => [
                    'Guitarra SG Rock' => 1,
                    'Bateria Eletronica Starter' => 1,
                ],
            ],
        ];

        foreach ($customerCarts as $data) {
            $user = DB::table('users')->where('email', $data['email'])->first();

            if (!$user) {
                throw new RuntimeException("Usuário não encontrado: {$data['email']}");
            }

            $cart = DB::table('carts')->where('user_id', $user->id)->first();

            if ($cart) {
                $cartId = $cart->id;
            } else {
                $cartId = DB::table('carts')->insertGetId([
                    'user_id' => $user->id,
                    'guest_token_hash' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->insertItems($cartId, $data['items']);
        }

        $seedPassword = config('rockerstore.seed_password');

        if (empty($seedPassword)) {
            throw new RuntimeException('Configure ROCKERSTORE_SEED_PASSWORD no .env.');
        }

        $guestToken = hash_hmac('sha256', 'rockerstore-guest-demo-1', $seedPassword);
        $guestTokenHash = hash('sha256', $guestToken);

        $guestCart = DB::table('carts')
            ->where('guest_token_hash', $guestTokenHash)
            ->first();

        if ($guestCart) {
            $guestCartId = $guestCart->id;
        } else {
            $guestCartId = DB::table('carts')->insertGetId([
                'user_id' => null,
                'guest_token_hash' => $guestTokenHash,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->insertItems($guestCartId, [
            'Guitarra Telecaster Vintage' => 1,
            'Baixo Short Scale' => 1,
        ]);
    }

    private function insertItems(int $cartId, array $items): void
    {
        foreach ($items as $productName => $quantity) {
            $product = DB::table('products')->where('name', $productName)->first();

            if (!$product) {
                throw new RuntimeException("Produto não encontrado: {$productName}");
            }

            DB::table('cart_items')->updateOrInsert(
                [
                    'cart_id' => $cartId,
                    'product_id' => $product->id,
                ],
                [
                    'quantity' => $quantity,
                    'updated_at' => now(),
                ]
            );
        }
    }
}
