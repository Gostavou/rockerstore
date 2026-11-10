<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {
    }

    public function index(
        Request $request
    ): AnonymousResourceCollection {
        return OrderResource::collection(
            $this->orderService->listForUser(
                $request->user('sanctum')->id
            )
        );
    }

    public function store(
        StoreOrderRequest $request
    ): JsonResponse {
        $order = $this->orderService->createOrder(
            $request->user('sanctum')->id,
            $request->integer('address_id')
        );

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(
        Request $request,
        int $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->showOrder(
                $order,
                $request->user('sanctum')->id
            )
        );
    }

    public function pay(
        Request $request,
        int $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->payOrder(
                $order,
                $request->user('sanctum')->id
            )
        );
    }

    public function cancel(
        Request $request,
        int $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->cancelOrder(
                $order,
                $request->user('sanctum')->id
            )
        );
    }
}
