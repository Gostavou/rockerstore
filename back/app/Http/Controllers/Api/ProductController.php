<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ListProductsRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Requests\Product\StoreProductRequest;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Product\UpdateProductRequest;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {
    }

    public function index(
        ListProductsRequest $request
    ): AnonymousResourceCollection {
        $products = $this->productService->list(
            $request->validated()
        );

        return ProductResource::collection($products);
    }

    public function show(int $product): ProductResource
    {
        $productFound = $this->productService->getById(
            $product
        );

        return new ProductResource($productFound);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Produto cadastrado com sucesso.',
            'data' => new ProductResource($product),
        ], 201);
    }

    public function update(
        UpdateProductRequest $request,
        int $product
    ): JsonResponse {
        $updatedProduct = $this->productService->update(
            $product,
            $request->validated()
        );

        return response()->json([
            'message' => 'Produto atualizado com sucesso.',
            'data' => new ProductResource($updatedProduct),
        ], 200);
    }
}
