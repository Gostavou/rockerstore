<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()
            ->whereIn('slug', ['guitarras', 'baixos', 'baterias'])
            ->pluck('id', 'slug');

        foreach (['guitarras', 'baixos', 'baterias'] as $slug) {
            if (!isset($categories[$slug])) {
                throw new RuntimeException("Categoria não encontrada: {$slug}");
            }
        }

        $products = [
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Stratocaster Classic',
                'description' => 'Guitarra elétrica com três captadores single coil e configuração clássica.',
                'price_cents' => 189990,
                'stock_quantity' => 8,
                'image' => 'guitarra-stratocaster-classic.webp',
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Les Paul Standard',
                'description' => 'Guitarra elétrica com dois captadores humbucker e corpo estilo Les Paul.',
                'price_cents' => 329990,
                'stock_quantity' => 5,
                'image' => 'guitarra-les-paul-standard.webp',
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Superstrat Metal',
                'description' => 'Guitarra voltada para rock e metal, com captadores de alta saída.',
                'price_cents' => 279990,
                'stock_quantity' => 4,
                'image' => 'guitarra-superstrat-metal.webp',
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra SG Rock',
                'description' => 'Guitarra elétrica com corpo de duplo recorte e timbre encorpado.',
                'price_cents' => 249990,
                'stock_quantity' => 7,
                'image' => 'guitarra-sg-rock.webp',
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Precision Classic',
                'description' => 'Contrabaixo elétrico de quatro cordas com captador split coil.',
                'price_cents' => 189990,
                'stock_quantity' => 7,
                'image' => 'baixo-precision-classic.webp',
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Cinco Cordas Pro',
                'description' => 'Contrabaixo elétrico de cinco cordas para maior extensão grave.',
                'price_cents' => 299990,
                'stock_quantity' => 4,
                'image' => 'baixo-cinco-cordas-pro.webp',
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Thunderbird Rock',
                'description' => 'Baixo elétrico com corpo de formato inspirado no rock clássico.',
                'price_cents' => 349990,
                'stock_quantity' => 3,
                'image' => 'baixo-thunderbird-rock.webp',
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Short Scale',
                'description' => 'Baixo de escala curta para maior conforto ao tocar.',
                'price_cents' => 159990,
                'stock_quantity' => 8,
                'image' => 'baixo-short-scale.webp',
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Iniciante',
                'description' => 'Contrabaixo elétrico de entrada com quatro cordas.',
                'price_cents' => 99990,
                'stock_quantity' => 10,
                'image' => 'baixo-iniciante.webp',
            ],

            [
                'category' => 'baterias',
                'name' => 'Bateria Acustica Rock',
                'description' => 'Kit de bateria acústica com bumbo, caixa e tons.',
                'price_cents' => 429990,
                'stock_quantity' => 4,
                'image' => 'bateria-acustica-rock.webp',
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Acustica Compact',
                'description' => 'Kit acústico compacto para espaços reduzidos.',
                'price_cents' => 319990,
                'stock_quantity' => 5,
                'image' => 'bateria-acustica-compact.webp',
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Eletronica Starter',
                'description' => 'Bateria eletrônica para estudo e prática.',
                'price_cents' => 259990,
                'stock_quantity' => 7,
                'image' => 'bateria-eletronica-starter.webp',
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Eletronica Pro',
                'description' => 'Bateria eletrônica com pads e módulo de sons avançado.',
                'price_cents' => 649990,
                'stock_quantity' => 3,
                'image' => 'bateria-eletronica-pro.webp',
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Double Bass Metal',
                'description' => 'Kit acústico configurado para apresentações de rock pesado.',
                'price_cents' => 799990,
                'stock_quantity' => 2,
                'image' => 'bateria-double-bass-metal.webp',
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Jazz Compact',
                'description' => 'Bateria acústica compacta para apresentações e ensaios.',
                'price_cents' => 379990,
                'stock_quantity' => 4,
                'image' => 'bateria-jazz-compact.webp',
            ],
        ];

        foreach ($products as $productData) {
            $source = database_path('seeders/images/' . $productData['image']);

            if (!is_file($source)) {
                throw new RuntimeException("Imagem não encontrada: {$source}");
            }
        }

        foreach ($products as $productData) {
            $source = database_path('seeders/images/' . $productData['image']);
            $destination = 'products/' . $productData['image'];

            if (!Storage::disk('public')->put(
                $destination,
                file_get_contents($source)
            )) {
                throw new RuntimeException(
                    "Falha ao copiar imagem: {$productData['image']}"
                );
            }

            Product::updateOrCreate(
                ['name' => $productData['name']],
                [
                    'category_id' => $categories[$productData['category']],
                    'description' => $productData['description'],
                    'price_cents' => $productData['price_cents'],
                    'stock_quantity' => $productData['stock_quantity'],
                    'image_path' => $destination,
                    'is_active' => true,
                ]
            );
        }

        $removedProducts = [
    'Guitarra Explorer Heavy',
    'Guitarra Flying V',
    'Guitarra Junior Rock',
    'Guitarra Baritona Metal',
    'Guitarra Sete Cordas',
    'Guitarra Signature Edition',
    'Guitarra Telecaster Vintage',
    'Guitarra Semi Acustica Jazz',
    'Baixo Ativo Modern',
    'Baixo Fretless Jazz',
    'Baixo Seis Cordas Extended',
    'Baixo Vintage Edition',
    'Baixo Jazz Bass Standard',
    'Bateria Studio Session',
    'Bateria Premium Stage',
];

        Product::query()
            ->whereIn('name', $removedProducts)
            ->delete();
    }
}
