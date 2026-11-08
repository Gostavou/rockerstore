<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ListProductsRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
}
