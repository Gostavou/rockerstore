<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Guitarras',
                'slug' => 'guitarras',
            ],
            [
                'name' => 'Baixos',
                'slug' => 'baixos',
            ],
            [
                'name' => 'Baterias',
                'slug' => 'baterias',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name']]
            );
        }
    }
}
