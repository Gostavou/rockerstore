<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function list(): LengthAwarePaginator
    {
        return Product::query()
            ->with('category')
            ->where('is_active', true)
            ->orderBy('name')
            ->paginate(12);
    }

    public function getById(int $id): Product
    {
        return Product::query()
            ->with('category')
            ->where('is_active', true)
            ->findOrFail($id);
    }
}
