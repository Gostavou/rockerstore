<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function list(): Collection
    {
        return Category::query()
            ->select(['id', 'name', 'slug'])
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Category
    {
        $name = Str::squish($data['name']);
        $slug = Str::slug($name);

        if ($slug === '' || strlen($slug) > 120) {
            throw ValidationException::withMessages([
                'name' => ['O nome não gera um identificador válido.'],
            ]);
        }

        if (Category::where('slug', $slug)->exists()) {
            throw ValidationException::withMessages([
                'name' => ['Já existe uma categoria com esse identificador.'],
            ]);
        }

        $category = new Category();
        $category->name = $name;
        $category->slug = $slug;
        $category->save();

        return $category;
    }

    public function update(Category $category, array $data): Category
    {
        $name = Str::squish($data['name']);
        $slug = Str::slug($name);

        if ($slug === '' || strlen($slug) > 120) {
            throw ValidationException::withMessages([
                'name' => ['O nome não gera um identificador válido.'],
            ]);
        }

        $slugExists = Category::query()
            ->where('slug', $slug)
            ->where('id', '!=', $category->id)
            ->exists();

        if ($slugExists) {
            throw ValidationException::withMessages([
                'name' => ['Já existe uma categoria com esse identificador.'],
            ]);
        }

        $category->name = $name;
        $category->slug = $slug;
        $category->save();

        return $category;
    }

    public function delete(Category $category): void
    {
        $hasProducts = $category->products()->exists();

        if ($hasProducts) {
            throw new \Symfony\Component\HttpKernel\Exception\HttpException(
                409,
                'Não é possível excluir uma categoria que possui produtos.'
            );
        }

        $category->delete();
    }
}
