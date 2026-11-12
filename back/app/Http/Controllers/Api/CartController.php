<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\StoreCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use App\Services\GuestCartSessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService,
        private GuestCartSessionService $guestCartSession
    ) {
    }

    private function identity(Request $request): array
    {
        $user = $request->user('sanctum');

        if ($user !== null) {
            return [$user->id, null];
        }

        return [null, $this->guestCartSession->token($request)];
    }

    public function index(Request $request): JsonResponse
    {
        [$userId, $guestToken] = $this->identity($request);
        $cart = $this->cartService->get($userId, $guestToken);

        return (new CartResource($cart))->response()->setStatusCode(200);
    }

    public function store(StoreCartItemRequest $request): JsonResource
    {
        [$userId, $guestToken] = $this->identity($request);
        $data = $request->validated();

        return new CartResource(
            $this->cartService->add($userId, $guestToken, $data['product_id'], $data['quantity'])
        );
    }

    public function update(UpdateCartItemRequest $request, int $item): JsonResource
    {
        [$userId, $guestToken] = $this->identity($request);
        $data = $request->validated();

        return new CartResource(
            $this->cartService->update($userId, $guestToken, $item, $data['quantity'])
        );
    }

    public function destroy(Request $request, int $item): JsonResource
    {
        [$userId, $guestToken] = $this->identity($request);

        return new CartResource(
            $this->cartService->remove($userId, $guestToken, $item)
        );
    }
}
