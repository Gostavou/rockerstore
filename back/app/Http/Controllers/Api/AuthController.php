<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {
    }

    public function register(
        RegisterRequest $request
    ): JsonResponse {
        $user = $this->authService->register(
            $request->validated()
        );

        return response()->json([
            'message' => 'Cliente cadastrado com sucesso.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(
        LoginRequest $request
    ): JsonResponse {
        $result = $this->authService->login(
            $request->validated()
        );

        $user = $result['user'];

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token_type' => 'Bearer',
                'access_token' => $result['token'],
            ],
        ], 200);
    }


    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->authService->logout($user);

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ], 200);
    }

}
