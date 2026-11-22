<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReviewService
{
    public function list(int $productId): LengthAwarePaginator
    {
        return Review::query()
            ->where('product_id', $productId)
            ->with('user:id,name')
            ->orderByDesc('id')
            ->paginate(8);
    }

    public function mine(
        int $userId,
        int $productId
    ): ?Review {
        return Review::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->with('user:id,name')
            ->first();
    }

    public function hasDeliveredPurchase(
        int $userId,
        int $productId
    ): bool {
        return OrderItem::query()
            ->where('product_id', $productId)
            ->whereHas('order', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', 'entregue');
            })
            ->exists();
    }

    public function create(
        int $userId,
        int $productId,
        array $data
    ): Review {
        $existing = Review::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();

        abort_if(
            $existing,
            409,
            'Você já avaliou este produto.'
        );

        abort_unless(
            $this->hasDeliveredPurchase($userId, $productId),
            403,
            'Você só pode avaliar produtos de pedidos entregues.'
        );

        return Review::create([
            'user_id' => $userId,
            'product_id' => $productId,
            'rating' => $data['rating'],
            'comment' => $data['comment'],
        ])->load('user:id,name');
    }

    public function update(
        int $userId,
        int $productId,
        array $data
    ): Review {
        $review = Review::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->firstOrFail();

        $review->update([
            'rating' => $data['rating'],
            'comment' => $data['comment'],
        ]);

        return $review->refresh()->load('user:id,name');
    }

    public function delete(
        int $userId,
        int $productId
    ): void {
        $review = Review::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->firstOrFail();

        $review->delete();
    }
}
