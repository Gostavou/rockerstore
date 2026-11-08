<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_name' => ['sometimes', 'required', 'string', 'max:150'],
            'zip_code' => ['sometimes', 'required', 'string', 'regex:/^\d{5}-?\d{3}$/'],
            'street' => ['sometimes', 'required', 'string', 'max:150'],
            'number' => ['sometimes', 'required', 'string', 'max:20'],
            'complement' => ['sometimes', 'nullable', 'string', 'max:150'],
            'district' => ['sometimes', 'required', 'string', 'max:100'],
            'city' => ['sometimes', 'required', 'string', 'max:100'],
            'state' => ['sometimes', 'required', 'string', 'size:2'],
        ];
    }
}
