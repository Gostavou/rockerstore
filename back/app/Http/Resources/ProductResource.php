<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,

            'price_cents' => $this->price_cents,

            'stock_quantity' => $this->stock_quantity,
            'is_active' => $this->is_active,

            'image_path' => $this->image_path,

            'category' => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,


            ],
        ];
    }
}
