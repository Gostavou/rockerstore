<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with('category')
            ->where('is_active', true);

        // Pesquisa pelo nome
        if (!empty($filters['search'])) {
            $query->where(
                'name',
                'like',
                '%' . $filters['search'] . '%'
            );
        }

        // Filtro por categoria
        if (isset($filters['category_id'])) {
            $query->where(
                'category_id',
                $filters['category_id']
            );
        }

        // Preço mínimo
        if (isset($filters['min_price_cents'])) {
            $query->where(
                'price_cents',
                '>=',
                $filters['min_price_cents']
            );
        }

        // Preço máximo
        if (isset($filters['max_price_cents'])) {
            $query->where(
                'price_cents',
                '<=',
                $filters['max_price_cents']
            );
        }

        return $query
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();
    }


    public function listForAdmin(): LengthAwarePaginator
    {
        return Product::query()
            ->with('category')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();
    }


    public function getById(int $id): Product
    {
        return Product::query()
            ->with('category')
            ->where('is_active', true)
            ->findOrFail($id);
    }

    public function create(array $data): Product
    {
        $data['is_active'] = $data['is_active'] ?? true;

        $product = Product::create($data);

        return $product->load('category');
    }

    public function update(int $id, array $data): Product
    {
        $product = Product::findOrFail($id);

        $product->update($data);

        return $product->load('category');
    }

    public function delete(int $id): void
    {
        $product = Product::findOrFail($id);

        $product->delete();
    }
}
