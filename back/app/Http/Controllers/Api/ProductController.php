<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private ProductService $productService
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        $products = $this->productService->list();

        return ProductResource::collection($products);
    }

    public function show(int $product): ProductResource
    {
        $productFound = $this->productService->getById($product);

        return new ProductResource($productFound);
    }
}
