<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use App\Services\CartService;
use App\Services\GuestCartSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService,
        private CartService $cartService,
        private GuestCartSessionService $guestCartSession
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register($request->validated());
        $request->session()->regenerate();
        $warnings = $this->mergeCart($request, $user->id);

        return response()->json([
            'message' => 'Cliente cadastrado com sucesso.',
            'data' => [
                'id' => $user->id, 'name' => $user->name,
                'email' => $user->email, 'role' => $user->role,
                'cart_merge' => ['warnings' => $warnings],
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->authService->login($request->validated());
        $request->session()->regenerate();
        $warnings = $this->mergeCart($request, $user->id);

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'data' => [
                'user' => [
                    'id' => $user->id, 'name' => $user->name,
                    'email' => $user->email, 'role' => $user->role,
                ],
                'cart_merge' => ['warnings' => $warnings],
            ],
        ], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ], 200);
    }

    private function mergeCart(Request $request, int $userId): array
    {
        $guestToken = $this->guestCartSession->existingToken($request);
        $warnings = $this->cartService->mergeGuestCart($userId, $guestToken);

        if ($guestToken !== null) {
            $this->guestCartSession->forget();
        }

        return $warnings;
    }
}
