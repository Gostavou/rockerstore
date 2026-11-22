<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class SaveReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rating' => [
                'required',
                'integer',
                'between:1,5',
            ],
            'comment' => [
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.between' => 'A nota deve ser de 1 a 5 estrelas.',
            'comment.min' => 'Escreva pelo menos 10 caracteres.',
            'comment.max' => 'O comentário pode ter até 1000 caracteres.',
        ];
    }
}
