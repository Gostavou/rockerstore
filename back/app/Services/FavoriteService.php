<?php

namespace App\Services;

use App\Models\Favorite;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class FavoriteService
{
    public function list(int $userId): Collection
    {
        return Favorite::query()
            ->where('user_id', $userId)
            ->whereHas('product', function (Builder $query) {
                $query->where('is_active', true);
            })
            ->with('product.category')
            ->orderByDesc('id')
            ->get()
            ->pluck('product');
    }

    public function add(int $userId, int $productId): bool
    {
        Product::query()
            ->where('is_active', true)
            ->findOrFail($productId);

        $favorite = Favorite::firstOrCreate([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        return $favorite->wasRecentlyCreated;
    }

    public function remove(int $userId, int $productId): void
    {
        Favorite::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();
    }
}
