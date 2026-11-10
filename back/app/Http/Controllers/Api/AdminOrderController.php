<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {
    }

    public function index(
        Request $request
    ): AnonymousResourceCollection {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'string',
                Rule::in([
                    'aguardando_pagamento',
                    'pago',
                    'enviado',
                    'entregue',
                    'cancelado',
                ]),
            ],
        ]);

        return OrderResource::collection(
            $this->orderService->listForAdmin(
                $validated['status'] ?? null
            )
        );
    }

    public function show(
        Request $request,
        int $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->showOrder(
                $order,
                $request->user('sanctum')->id,
                true
            )
        );
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        int $order
    ): OrderResource {
        return new OrderResource(
            $this->orderService->updateStatus(
                $order,
                $request->validated('status')
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
                $request->user('sanctum')->id,
                true
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
                $request->user('sanctum')->id,
                true
            )
        );
    }
}
