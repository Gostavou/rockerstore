<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Review;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class ProductService
{
    public function list(array $filters = []): LengthAwarePaginator
    {

        $query = Product::query()
            ->with('category')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('is_active', true);


        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['min_price_cents'])) {
            $query->where('price_cents', '>=', $filters['min_price_cents']);
        }

        if (isset($filters['max_price_cents'])) {
            $query->where('price_cents', '<=', $filters['max_price_cents']);
        }

        $sort = $filters['sort'] ?? 'name';

        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price_cents', 'asc')->orderBy('id');
                break;

            case 'price_desc':
                $query->orderBy('price_cents', 'desc')->orderBy('id');
                break;

            case 'recent':
                $query->orderBy('created_at', 'desc')->orderBy('id', 'desc');
                break;

            default:
                $query->orderBy('name', 'asc')->orderBy('id');
                break;
        }

        return $query->paginate(12)->withQueryString();
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
        $product = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->findOrFail($id);

        $stats = DB::table('reviews')
            ->where('product_id', $id)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('AVG(rating) as average')
            ->selectRaw('SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1')
            ->selectRaw('SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2')
            ->selectRaw('SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3')
            ->selectRaw('SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4')
            ->selectRaw('SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5')
            ->first();

        $product->setAttribute(
            'reviews_count',
            (int) ($stats->total ?? 0)
        );

        $product->setAttribute(
            'reviews_avg_rating',
            (float) ($stats->average ?? 0)
        );

        $product->setAttribute('review_distribution', [
            1 => (int) ($stats->stars_1 ?? 0),
            2 => (int) ($stats->stars_2 ?? 0),
            3 => (int) ($stats->stars_3 ?? 0),
            4 => (int) ($stats->stars_4 ?? 0),
            5 => (int) ($stats->stars_5 ?? 0),
        ]);

        return $product;
    }


    public function create(array $data, ?UploadedFile $image = null): Product
    {
        $data['is_active'] = $data['is_active'] ?? true;
        $newPath = null;

        if ($image !== null) {
            $newPath = $image->store('products', 'public');

            if ($newPath === false) {
                throw new RuntimeException('Não foi possível salvar a imagem do produto.');
            }

            $data['image_path'] = $newPath;
        }

        try {
            $product = Product::create($data);
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        return $product->load('category');
    }

    public function update(
        int $id,
        array $data,
        ?UploadedFile $image = null,
        bool $removeImage = false
    ): Product {
        $product = Product::findOrFail($id);
        $oldPath = $product->image_path;
        $newPath = null;

        if ($image !== null) {
            $newPath = $image->store('products', 'public');

            if ($newPath === false) {
                throw new RuntimeException('Não foi possível salvar a nova imagem.');
            }

            $data['image_path'] = $newPath;
        } elseif ($removeImage) {
            $data['image_path'] = null;
        }

        try {
            $product->update($data);
        } catch (Throwable $exception) {
            if ($newPath !== null) {
                Storage::disk('public')->delete($newPath);
            }

            throw $exception;
        }

        if (
            ($newPath !== null || $removeImage) &&
            is_string($oldPath) &&
            preg_match('~^products/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$~i', $oldPath) === 1 &&
            !Product::withTrashed()->where('image_path', $oldPath)->exists()
        ) {
            Storage::disk('public')->delete($oldPath);
        }

        return $product->load('category');
    }

    public function delete(int $id): void
    {
        $product = Product::findOrFail($id);
        $product->delete();
    }
}
