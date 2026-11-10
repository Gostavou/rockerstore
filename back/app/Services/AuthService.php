<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'cliente',
        ]);

        Auth::guard('web')->login($user);

        return $user;
    }

    public function login(array $data): User
    {
        $authenticated = Auth::guard('web')->attempt([
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        if (!$authenticated) {
            throw ValidationException::withMessages([
                'email' => ['E-mail ou senha incorretos.'],
            ]);
        }

        return Auth::guard('web')->user();
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
    }
}
