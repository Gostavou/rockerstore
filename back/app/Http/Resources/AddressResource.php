<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'recipient_name' => $this->recipient_name,
            'zip_code' => $this->zip_code, 'street' => $this->street,
            'number' => $this->number, 'complement' => $this->complement,
            'district' => $this->district, 'city' => $this->city,
            'state' => $this->state,
        ];
    }
}
