<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class ListProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'min_price_cents' => ['sometimes', 'integer', 'min:0'],
            'max_price_cents' => ['sometimes', 'integer', 'min:0'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'sort' => ['sometimes', 'string', 'in:name,price_asc,price_desc,recent'],
        ];

        if ($this->filled('min_price_cents')) {
            $rules['max_price_cents'][] = 'gte:min_price_cents';
        }

        return $rules;
    }
}
