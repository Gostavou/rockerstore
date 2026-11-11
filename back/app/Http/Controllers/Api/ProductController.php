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


    public function indexAdmin(): AnonymousResourceCollection
    {
        $products = $this->productService->listForAdmin();

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
        $data = $request->safe()->except(['image']);

        $product = $this->productService->create(
            $data,
            $request->file('image')
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
        $data = $request->safe()->except([
            'image',
            'remove_image',
        ]);

        $updatedProduct = $this->productService->update(
            $product,
            $data,
            $request->file('image'),
            $request->boolean('remove_image')
        );

        return response()->json([
            'message' => 'Produto atualizado com sucesso.',
            'data' => new ProductResource($updatedProduct),
        ], 200);
    }

    public function destroy(int $product): JsonResponse
    {
        $this->productService->delete($product);

        return response()->json([
            'message' => 'Produto excluído com sucesso.',
        ], 200);
    }
}
