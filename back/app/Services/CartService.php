<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function get(int $userId): Cart
    {
        $cart = Cart::firstOrCreate(
            ['user_id' => $userId],
            ['guest_token_hash' => null]
        );

        return $cart->load([
            'items.product',
        ]);
    }

    public function add(
        int $userId,
        int $productId,
        int $quantity
    ): Cart {
        DB::transaction(function () use (
            $userId,
            $productId,
            $quantity
        ) {
            $product = Product::query()
                ->where('is_active', true)
                ->lockForUpdate()
                ->findOrFail($productId);

            $cart = Cart::firstOrCreate(
                ['user_id' => $userId],
                ['guest_token_hash' => null]
            );

            $item = $cart->items()
                ->where('product_id', $productId)
                ->first();

            $currentQuantity = $item?->quantity ?? 0;
            $newQuantity = $currentQuantity + $quantity;

            if ($newQuantity > $product->stock_quantity) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'Quantidade solicitada maior que o estoque disponível.',
                    ],
                ]);
            }

            if ($item) {
                $item->update([
                    'quantity' => $newQuantity,
                ]);
            } else {
                $cart->items()->create([
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ]);
            }
        });

        return $this->get($userId);
    }


    public function update(
        int $userId,
        int $itemId,
        int $quantity
    ): Cart {
        DB::transaction(function () use (
            $userId,
            $itemId,
            $quantity
        ) {
            $cart = Cart::query()
                ->where('user_id', $userId)
                ->firstOrFail();

            $item = $cart->items()
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();

            $product = Product::query()
                ->where('is_active', true)
                ->lockForUpdate()
                ->findOrFail($item->product_id);

            if ($quantity > $product->stock_quantity) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'Quantidade solicitada maior que o estoque disponível.',
                    ],
                ]);
            }

            $item->update([
                'quantity' => $quantity,
            ]);
        });

        return $this->get($userId);
    }

    public function remove(
        int $userId,
        int $itemId
    ): Cart {
        DB::transaction(function () use (
            $userId,
            $itemId
        ) {
            $cart = Cart::query()
                ->where('user_id', $userId)
                ->firstOrFail();

            $item = $cart->items()
                ->whereKey($itemId)
                ->firstOrFail();

            $item->delete();
        });

        return $this->get($userId);
    }

}
