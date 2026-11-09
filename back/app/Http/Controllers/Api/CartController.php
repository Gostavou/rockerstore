<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\StoreCartItemRequest;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Requests\Cart\UpdateCartItemRequest;

class CartController extends Controller
{
    public function __construct(
        private CartService $cartService
    ) {
    }

    public function index(Request $request): JsonResource
    {
        $cart = $this->cartService->get(
            $request->user()->id
        );

        return new CartResource($cart);
    }

    public function store(
        StoreCartItemRequest $request
    ): JsonResource {
        $data = $request->validated();

        $cart = $this->cartService->add(
            $request->user()->id,
            $data['product_id'],
            $data['quantity']
        );

        return new CartResource($cart);
    }


    public function update(
        UpdateCartItemRequest $request,
        int $item
    ): JsonResource {
        $data = $request->validated();

        $cart = $this->cartService->update(
            $request->user()->id,
            $item,
            $data['quantity']
        );

        return new CartResource($cart);
    }

    public function destroy(
        Request $request,
        int $item
    ): JsonResource {
        $cart = $this->cartService->remove(
            $request->user()->id,
            $item
        );

        return new CartResource($cart);
    }

}
