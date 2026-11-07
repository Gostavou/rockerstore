<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use RuntimeException;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Busca as categorias pelo slug.
        $categories = Category::query()
            ->whereIn('slug', [
                'guitarras',
                'baixos',
                'baterias',
            ])
            ->pluck('id', 'slug');

        // Garante que as categorias foram criadas.
        foreach (['guitarras', 'baixos', 'baterias'] as $slug) {
            if (!isset($categories[$slug])) {
                throw new RuntimeException(
                    "Categoria não encontrada: {$slug}"
                );
            }
        }

        // Dados fictícios para desenvolvimento e testes.
        // Preços armazenados em centavos.

        $products = [

            // =================================
            // GUITARRAS — 12 PRODUTOS
            // =================================

            [
                'category' => 'guitarras',
                'name' => 'Guitarra Stratocaster Classic',
                'description' => 'Guitarra elétrica com três captadores single coil e configuração clássica.',
                'price_cents' => 189990,
                'stock_quantity' => 8,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Les Paul Standard',
                'description' => 'Guitarra elétrica com dois captadores humbucker e corpo estilo Les Paul.',
                'price_cents' => 329990,
                'stock_quantity' => 5,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Telecaster Vintage',
                'description' => 'Guitarra elétrica com dois captadores single coil e ponte fixa.',
                'price_cents' => 219990,
                'stock_quantity' => 6,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Superstrat Metal',
                'description' => 'Guitarra voltada para rock e metal, com captadores de alta saída.',
                'price_cents' => 279990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra SG Rock',
                'description' => 'Guitarra elétrica com corpo de duplo recorte e timbre encorpado.',
                'price_cents' => 249990,
                'stock_quantity' => 7,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Explorer Heavy',
                'description' => 'Guitarra de formato angular para estilos de rock pesado.',
                'price_cents' => 389990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Flying V',
                'description' => 'Guitarra elétrica com corpo em formato V.',
                'price_cents' => 359990,
                'stock_quantity' => 2,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Semi Acustica Jazz',
                'description' => 'Guitarra semiacústica com captadores humbucker.',
                'price_cents' => 419990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Junior Rock',
                'description' => 'Guitarra elétrica de entrada para iniciantes.',
                'price_cents' => 89990,
                'stock_quantity' => 12,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Baritona Metal',
                'description' => 'Guitarra de escala alongada para afinações graves.',
                'price_cents' => 449990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Sete Cordas',
                'description' => 'Guitarra elétrica de sete cordas para afinações estendidas.',
                'price_cents' => 319990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'guitarras',
                'name' => 'Guitarra Signature Edition',
                'description' => 'Guitarra elétrica de edição especial para demonstração.',
                'price_cents' => 599990,
                'stock_quantity' => 2,
                'is_active' => false,
            ],

            // =================================
            // BAIXOS — 10 PRODUTOS
            // =================================

            [
                'category' => 'baixos',
                'name' => 'Baixo Precision Classic',
                'description' => 'Contrabaixo elétrico de quatro cordas com captador split coil.',
                'price_cents' => 189990,
                'stock_quantity' => 7,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Jazz Bass Standard',
                'description' => 'Contrabaixo elétrico com dois captadores estilo Jazz Bass.',
                'price_cents' => 219990,
                'stock_quantity' => 5,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Cinco Cordas Pro',
                'description' => 'Contrabaixo elétrico de cinco cordas para maior extensão grave.',
                'price_cents' => 299990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Ativo Modern',
                'description' => 'Baixo elétrico com circuito ativo e equalização integrada.',
                'price_cents' => 269990,
                'stock_quantity' => 6,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Thunderbird Rock',
                'description' => 'Baixo elétrico com corpo de formato inspirado no rock clássico.',
                'price_cents' => 349990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Short Scale',
                'description' => 'Baixo de escala curta para maior conforto ao tocar.',
                'price_cents' => 159990,
                'stock_quantity' => 8,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Fretless Jazz',
                'description' => 'Contrabaixo sem trastes para técnicas expressivas.',
                'price_cents' => 289990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Seis Cordas Extended',
                'description' => 'Baixo elétrico de seis cordas para maior extensão de notas.',
                'price_cents' => 419990,
                'stock_quantity' => 2,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Iniciante',
                'description' => 'Contrabaixo elétrico de entrada com quatro cordas.',
                'price_cents' => 99990,
                'stock_quantity' => 10,
            ],
            [
                'category' => 'baixos',
                'name' => 'Baixo Vintage Edition',
                'description' => 'Baixo elétrico com acabamento clássico e circuito passivo.',
                'price_cents' => 239990,
                'stock_quantity' => 0,
            ],

            // =================================
            // BATERIAS — 8 PRODUTOS
            // =================================

            [
                'category' => 'baterias',
                'name' => 'Bateria Acustica Rock',
                'description' => 'Kit de bateria acústica com bumbo, caixa e tons.',
                'price_cents' => 429990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Acustica Compact',
                'description' => 'Kit acústico compacto para espaços reduzidos.',
                'price_cents' => 319990,
                'stock_quantity' => 5,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Eletronica Starter',
                'description' => 'Bateria eletrônica para estudo e prática.',
                'price_cents' => 259990,
                'stock_quantity' => 7,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Eletronica Pro',
                'description' => 'Bateria eletrônica com pads e módulo de sons avançado.',
                'price_cents' => 649990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Double Bass Metal',
                'description' => 'Kit acústico configurado para apresentações de rock pesado.',
                'price_cents' => 799990,
                'stock_quantity' => 2,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Jazz Compact',
                'description' => 'Bateria acústica compacta para apresentações e ensaios.',
                'price_cents' => 379990,
                'stock_quantity' => 4,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Studio Session',
                'description' => 'Kit acústico destinado a gravações e ensaios.',
                'price_cents' => 529990,
                'stock_quantity' => 3,
            ],
            [
                'category' => 'baterias',
                'name' => 'Bateria Premium Stage',
                'description' => 'Kit de bateria acústica de configuração profissional.',
                'price_cents' => 999990,
                'stock_quantity' => 1,
            ],
        ];

        // Percorre os produtos e salva no banco.
        foreach ($products as $productData) {
            $categorySlug = $productData['category'];

            Product::updateOrCreate(
                [
                    'name' => $productData['name'],
                ],
                [
                    'category_id' => $categories[$categorySlug],
                    'description' => $productData['description'],
                    'price_cents' => $productData['price_cents'],
                    'stock_quantity' => $productData['stock_quantity'],
                    'image_path' => null,
                    'is_active' => $productData['is_active'] ?? true,
                ]
            );
        }
    }
}
