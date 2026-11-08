<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $orders = [
            [
                'email' => 'cliente1@rockerstore.test',
                'status' => 'aguardando_pagamento',
                'shipping_cents' => 1990,
                'items' => [
                    'Guitarra Stratocaster Classic' => 1,
                    'Baixo Precision Classic' => 1,
                ],
            ],
            [
                'email' => 'cliente2@rockerstore.test',
                'status' => 'pago',
                'shipping_cents' => 0,
                'items' => [
                    'Guitarra SG Rock' => 1,
                    'Bateria Eletronica Starter' => 1,
                ],
            ],
            [
                'email' => 'cliente3@rockerstore.test',
                'status' => 'cancelado',
                'shipping_cents' => 2990,
                'items' => [
                    'Baixo Iniciante' => 2,
                ],
            ],
        ];

        DB::transaction(function () use ($orders) {
            foreach ($orders as $data) {
                $user = DB::table('users')
                    ->where('email', $data['email'])
                    ->first();

                if (!$user) {
                    throw new RuntimeException(
                        "Usuário não encontrado: {$data['email']}"
                    );
                }

                $address = DB::table('addresses')
                    ->where('user_id', $user->id)
                    ->first();

                if (!$address) {
                    throw new RuntimeException(
                        "Endereço não encontrado para {$data['email']}"
                    );
                }

                // Congela os dados do endereço.
                $addressSnapshot = json_encode([
                    'recipient_name' => $address->recipient_name,
                    'zip_code' => $address->zip_code,
                    'street' => $address->street,
                    'number' => $address->number,
                    'complement' => $address->complement,
                    'district' => $address->district,
                    'city' => $address->city,
                    'state' => $address->state,
                ], JSON_THROW_ON_ERROR);

                $orderItems = [];
                $subtotal = 0;

                foreach ($data['items'] as $productName => $quantity) {
                    $product = DB::table('products')
                        ->where('name', $productName)
                        ->first();

                    if (!$product) {
                        throw new RuntimeException(
                            "Produto não encontrado: {$productName}"
                        );
                    }

                    $itemSubtotal = $product->price_cents * $quantity;
                    $subtotal += $itemSubtotal;

                    $orderItems[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'unit_price_cents' => $product->price_cents,
                        'quantity' => $quantity,
                        'subtotal_cents' => $itemSubtotal,
                    ];
                }

                $shipping = $data['shipping_cents'];
                $total = $subtotal + $shipping;

                // Localiza o pedido de exemplo.
                $existingOrder = DB::table('orders')
                    ->where('user_id', $user->id)
                    ->where('status', $data['status'])
                    ->first();

                $orderData = [
                    'user_id' => $user->id,
                    'address_id' => $address->id,
                    'address_snapshot' => $addressSnapshot,
                    'subtotal_cents' => $subtotal,
                    'shipping_cents' => $shipping,
                    'total_cents' => $total,
                    'status' => $data['status'],
                    'paid_at' => $data['status'] === 'pago'
                        ? now()
                        : null,
                    'updated_at' => now(),
                ];

                if ($existingOrder) {
                    $orderId = $existingOrder->id;

                    DB::table('orders')
                        ->where('id', $orderId)
                        ->update($orderData);
                } else {
                    $orderId = DB::table('orders')
                        ->insertGetId([
                            ...$orderData,
                            'created_at' => now(),
                        ]);
                }

                // Cria ou atualiza os itens do pedido.
                foreach ($orderItems as $item) {
                    DB::table('order_items')->updateOrInsert(
                        [
                            'order_id' => $orderId,
                            'product_id' => $item['product_id'],
                        ],
                        [
                            'product_name' => $item['product_name'],
                            'unit_price_cents' => $item['unit_price_cents'],
                            'quantity' => $item['quantity'],
                            'subtotal_cents' => $item['subtotal_cents'],
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        });
    }
}
