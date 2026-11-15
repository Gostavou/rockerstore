<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Favorite\StoreFavoriteRequest;
use App\Http\Resources\ProductResource;
use App\Services\FavoriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FavoriteController extends Controller
{
    public function __construct(
        private FavoriteService $favoriteService
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $this->favoriteService->list(
            $request->user()->id
        );

        return ProductResource::collection($products);
    }

    public function store(StoreFavoriteRequest $request): JsonResponse
    {
        $created = $this->favoriteService->add(
            $request->user()->id,
            $request->integer('product_id')
        );

        return response()->json([
            'message' => $created
                ? 'Produto adicionado aos favoritos.'
                : 'Produto já está nos favoritos.',
        ], $created ? 201 : 200);
    }

    public function destroy(Request $request, int $product): JsonResponse
    {
        $this->favoriteService->remove(
            $request->user()->id,
            $product
        );

        return response()->json([
            'message' => 'Produto removido dos favoritos.',
        ]);
    }
}
