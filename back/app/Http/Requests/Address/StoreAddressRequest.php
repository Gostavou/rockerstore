<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_name' => ['required', 'string', 'max:150'],
            'zip_code' => ['required', 'string', 'regex:/^\d{5}-?\d{3}$/'],
            'street' => ['required', 'string', 'max:150'],
            'number' => ['required', 'string', 'max:20'],
            'complement' => ['nullable', 'string', 'max:150'],
            'district' => ['required', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'size:2'],
        ];
    }
}
