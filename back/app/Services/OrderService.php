<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Pagination\LengthAwarePaginator;

class OrderService
{
    private const SHIPPING_CENTS = 1500;

    public function createOrder(
        int $userId,
        int $addressId
    ): Order {
        return DB::transaction(function () use (
            $userId,
            $addressId
        ): Order {
            $address = Address::query()
                ->where('user_id', $userId)
                ->findOrFail($addressId);

            $cart = Cart::query()
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->first();

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart' => 'O carrinho está vazio.',
                ]);
            }

            $cartItems = $cart->items()
                ->orderBy('product_id')
                ->lockForUpdate()
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'O carrinho está vazio.',
                ]);
            }

            $items = [];
            $subtotal = 0;

            foreach ($cartItems as $cartItem) {
                $product = Product::query()
                    ->lockForUpdate()
                    ->find($cartItem->product_id);

                if (!$product || !$product->is_active) {
                    throw ValidationException::withMessages([
                        'cart' => 'Um produto do carrinho está indisponível.',
                    ]);
                }

                if ($product->stock_quantity < $cartItem->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => "Estoque insuficiente para {$product->name}.",
                    ]);
                }

                $lineTotal = $product->price_cents
                    * $cartItem->quantity;

                $subtotal += $lineTotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price_cents' => $product->price_cents,
                    'quantity' => $cartItem->quantity,
                    'subtotal_cents' => $lineTotal,
                    'product' => $product,
                ];
            }

            $shipping = self::SHIPPING_CENTS;

            $order = Order::create([
                'user_id' => $userId,
                'address_id' => $address->id,
                'address_snapshot' => $address->only([
                    'recipient_name',
                    'zip_code',
                    'street',
                    'number',
                    'complement',
                    'district',
                    'city',
                    'state',
                ]),
                'subtotal_cents' => $subtotal,
                'shipping_cents' => $shipping,
                'total_cents' => $subtotal + $shipping,
                'status' => 'aguardando_pagamento',
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'unit_price_cents' => $item['unit_price_cents'],
                    'quantity' => $item['quantity'],
                    'subtotal_cents' => $item['subtotal_cents'],
                ]);

                $item['product']->decrement(
                    'stock_quantity',
                    $item['quantity']
                );
            }

            $cart->items()->delete();

            return $order->load('items');
        }, 3);
    }


    public function listForUser(int $userId): LengthAwarePaginator
    {
        return Order::query()
            ->where('user_id', $userId)
            ->latest('id')
            ->paginate(10);
    }

    public function listForAdmin(
        ?string $status = null
    ): LengthAwarePaginator {
        return Order::query()
            ->with('user')
            ->when(
                $status !== null,
                fn ($query) => $query->where('status', $status)
            )
            ->latest('id')
            ->paginate(15);
    }

    public function showOrder(
        int $orderId,
        int $actorId,
        bool $isAdmin = false
    ): Order {
        $order = Order::query()->findOrFail($orderId);

        abort_if(
            !$isAdmin && (int) $order->user_id !== $actorId,
            403,
            'Você não tem permissão para acessar este pedido.'
        );

        return $order->load(
            $isAdmin ? ['items', 'user'] : ['items']
        );
    }

    private function lockedOrder(
        int $orderId,
        int $actorId,
        bool $isAdmin
    ): Order {
        $order = Order::query()
            ->lockForUpdate()
            ->findOrFail($orderId);

        abort_if(
            !$isAdmin && (int) $order->user_id !== $actorId,
            403,
            'Você não tem permissão para alterar este pedido.'
        );

        return $order;
    }

    public function payOrder(
        int $orderId,
        int $actorId,
        bool $isAdmin = false
    ): Order {
        return DB::transaction(function () use (
            $orderId,
            $actorId,
            $isAdmin
        ): Order {
            $order = $this->lockedOrder(
                $orderId,
                $actorId,
                $isAdmin
            );

            abort_if(
                $order->status !== 'aguardando_pagamento',
                409,
                'Este pedido não está aguardando pagamento.'
            );

            $order->update([
                'status' => 'pago',
                'paid_at' => now(),
            ]);

            return $order->load('items');
        }, 3);
    }

    public function cancelOrder(
        int $orderId,
        int $actorId,
        bool $isAdmin = false
    ): Order {
        return DB::transaction(function () use (
            $orderId,
            $actorId,
            $isAdmin
        ): Order {
            $order = $this->lockedOrder(
                $orderId,
                $actorId,
                $isAdmin
            );

            abort_if(
                $order->status !== 'aguardando_pagamento',
                409,
                'Somente pedidos aguardando pagamento podem ser cancelados.'
            );

            $items = $order->items()
                ->orderBy('product_id')
                ->get();

            foreach ($items as $item) {
                $product = Product::withTrashed()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $product->increment(
                    'stock_quantity',
                    $item->quantity
                );
            }

            $order->update([
                'status' => 'cancelado',
            ]);

            return $order->load('items');
        }, 3);
    }

    public function updateStatus(
        int $orderId,
        string $newStatus
    ): Order {
        return DB::transaction(function () use (
            $orderId,
            $newStatus
        ): Order {
            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($orderId);

            $allowedNextStatus = match ($order->status) {
                'pago' => 'enviado',
                'enviado' => 'entregue',
                default => null,
            };

            abort_if(
                $newStatus !== $allowedNextStatus,
                409,
                'Transição de status não permitida.'
            );

            $order->update([
                'status' => $newStatus,
            ]);

            return $order->load('items');
        }, 3);
    }

}
