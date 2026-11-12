<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->items->map(function ($item) {
            $product = $item->product;
            $unitPrice = $product?->price_cents ?? 0;

            return [
                'id' => $item->id,
                'product' => $product ? [
                    'id' => $product->id, 'name' => $product->name,
                    'price_cents' => $product->price_cents,
                    'stock_quantity' => $product->stock_quantity,
                    'is_active' => $product->is_active,
                    'image_path' => $product->image_path,
                ] : null,
                'quantity' => $item->quantity,
                'line_total_cents' => $unitPrice * $item->quantity,
            ];
        });

        return [
            'id' => $this->id,
            'items' => $items,
            'subtotal_cents' => $items->sum('line_total_cents'),
        ];
    }
}
