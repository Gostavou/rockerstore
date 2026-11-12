<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateAccountRequest;
use Illuminate\Http\JsonResponse;

class AccountController extends Controller
{
    public function update(UpdateAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => 'Dados atualizados com sucesso.',
            'data' => [
                'id' => $user->id, 'name' => $user->name,
                'email' => $user->email, 'role' => $user->role,
            ],
        ], 200);
    }
}
