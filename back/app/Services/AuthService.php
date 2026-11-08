<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function register(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'cliente',
        ]);
    }

    public function login(array $data): array
    {
        // busca pelo e-mail informado
        $user = User::where('email', $data['email'])
            ->first();

        // verifica existencia do usuário e se a senha é válida
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-mail ou senha incorretos.'],
            ]);
        }

        // token para até 24 horas
        $token = $user->createToken(
            'rockerstore-api',
            ['*'],
            now()->addDay()
        );

        return [
            'user' => $user,
            'token' => $token->plainTextToken,
        ];
    }


    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if (!$token instanceof PersonalAccessToken) {
            throw new AuthenticationException(
                'Token de acesso inválido.'
            );
        }

        $token->delete();
    }

}
