<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\SaveReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function __construct(
        private ReviewService $reviewService
    ) {
    }

    private function ensureProductExists(int $product): void
    {
        Product::query()
            ->where('is_active', true)
            ->findOrFail($product);
    }

    public function index(int $product): AnonymousResourceCollection
    {
        $this->ensureProductExists($product);

        return ReviewResource::collection(
            $this->reviewService->list($product)
        );
    }

    public function me(
        Request $request,
        int $product
    ): JsonResponse {
        $this->ensureProductExists($product);

        $userId = $request->user()->id;

        $review = $this->reviewService->mine(
            $userId,
            $product
        );

        return response()->json([
            'data' => [
                'can_review' => $review === null &&
                    $this->reviewService->hasDeliveredPurchase(
                        $userId,
                        $product
                    ),
                'my_review' => $review
                    ? new ReviewResource($review)
                    : null,
            ],
        ]);
    }

    public function store(
        SaveReviewRequest $request,
        int $product
    ): JsonResponse {
        $this->ensureProductExists($product);

        $review = $this->reviewService->create(
            $request->user()->id,
            $product,
            $request->validated()
        );

        return response()->json([
            'message' => 'Avaliação publicada com sucesso.',
            'data' => new ReviewResource($review),
        ], 201);
    }

    public function update(
        SaveReviewRequest $request,
        int $product
    ): JsonResponse {
        $this->ensureProductExists($product);

        $review = $this->reviewService->update(
            $request->user()->id,
            $product,
            $request->validated()
        );

        return response()->json([
            'message' => 'Avaliação atualizada com sucesso.',
            'data' => new ReviewResource($review),
        ]);
    }

    public function destroy(
        Request $request,
        int $product
    ): JsonResponse {
        $this->ensureProductExists($product);

        $this->reviewService->delete(
            $request->user()->id,
            $product
        );

        return response()->json([
            'message' => 'Avaliação excluída com sucesso.',
        ]);
    }
}
