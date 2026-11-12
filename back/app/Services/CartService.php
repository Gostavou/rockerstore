<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

class CartService
{
    private function resolveCart(?int $userId, ?string $guestToken): Cart
    {
        if ($userId !== null) {
            return Cart::firstOrCreate(
                ['user_id' => $userId],
                ['guest_token_hash' => null]
            );
        }

        if ($guestToken === null) {
            throw new LogicException('Identificação do carrinho não informada.');
        }

        return Cart::firstOrCreate(
            ['guest_token_hash' => hash('sha256', $guestToken)],
            ['user_id' => null]
        );
    }

    public function get(?int $userId, ?string $guestToken): Cart
    {
        return $this->resolveCart($userId, $guestToken)->load('items.product');
    }

    public function add(?int $userId, ?string $guestToken, int $productId, int $quantity): Cart
    {
        DB::transaction(function () use ($userId, $guestToken, $productId, $quantity) {
            $product = Product::query()
                ->where('is_active', true)
                ->lockForUpdate()
                ->findOrFail($productId);

            $cart = $this->resolveCart($userId, $guestToken);

            $item = $cart->items()
                ->where('product_id', $productId)
                ->lockForUpdate()
                ->first();

            $newQuantity = ($item?->quantity ?? 0) + $quantity;

            if ($newQuantity > $product->stock_quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['Quantidade solicitada maior que o estoque disponível.'],
                ]);
            }

            if ($item) {
                $item->update(['quantity' => $newQuantity]);
            } else {
                $cart->items()->create([
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ]);
            }
        });

        return $this->get($userId, $guestToken);
    }

    public function update(?int $userId, ?string $guestToken, int $itemId, int $quantity): Cart
    {
        DB::transaction(function () use ($userId, $guestToken, $itemId, $quantity) {
            $cart = $this->resolveCart($userId, $guestToken);

            $item = $cart->items()
                ->whereKey($itemId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($quantity === 0) {
                $item->delete();
                return;
            }

            $product = Product::query()
                ->where('is_active', true)
                ->lockForUpdate()
                ->findOrFail($item->product_id);

            if ($quantity > $product->stock_quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['Quantidade solicitada maior que o estoque disponível.'],
                ]);
            }

            $item->update(['quantity' => $quantity]);
        });

        return $this->get($userId, $guestToken);
    }

    public function remove(?int $userId, ?string $guestToken, int $itemId): Cart
    {
        DB::transaction(function () use ($userId, $guestToken, $itemId) {
            $cart = $this->resolveCart($userId, $guestToken);

            $cart->items()
                ->whereKey($itemId)
                ->firstOrFail()
                ->delete();
        });

        return $this->get($userId, $guestToken);
    }

    public function mergeGuestCart(int $userId, ?string $guestToken): array
    {
        if ($guestToken === null) {
            return [];
        }

        return DB::transaction(function () use ($userId, $guestToken): array {
            $guestCart = Cart::query()
                ->where('guest_token_hash', hash('sha256', $guestToken))
                ->lockForUpdate()
                ->first();

            if ($guestCart === null) {
                return [];
            }

            $userCart = Cart::firstOrCreate(
                ['user_id' => $userId],
                ['guest_token_hash' => null]
            );

            $userCart = Cart::query()
                ->whereKey($userCart->id)
                ->lockForUpdate()
                ->firstOrFail();

            $warnings = [];
            $guestItems = $guestCart->items()->orderBy('product_id')->get();

            foreach ($guestItems as $guestItem) {
                $product = Product::query()
                    ->lockForUpdate()
                    ->find($guestItem->product_id);

                if ($product === null || !$product->is_active || $product->stock_quantity === 0) {
                    $warnings[] = [
                        'product_id' => $guestItem->product_id,
                        'message' => 'Produto indisponível. Item não transferido.',
                    ];
                    continue;
                }

                $userItem = $userCart->items()
                    ->where('product_id', $guestItem->product_id)
                    ->lockForUpdate()
                    ->first();

                $currentQuantity = $userItem?->quantity ?? 0;
                $requestedQuantity = $currentQuantity + $guestItem->quantity;
                $finalQuantity = min($requestedQuantity, $product->stock_quantity);

                if ($finalQuantity < $requestedQuantity) {
                    $warnings[] = [
                        'product_id' => $product->id,
                        'message' => 'Quantidade ajustada ao estoque disponível.',
                        'requested_quantity' => $requestedQuantity,
                        'applied_quantity' => $finalQuantity,
                    ];
                }

                if ($userItem) {
                    $userItem->update(['quantity' => $finalQuantity]);
                } else {
                    $userCart->items()->create([
                        'product_id' => $product->id,
                        'quantity' => $finalQuantity,
                    ]);
                }
            }

            $guestCart->delete();

            return $warnings;
        }, 3);
    }
}
