<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rotas públicas.
Route::post('/auth/register', [
    AuthController::class,
    'register',
]);

Route::post('/auth/login', [
    AuthController::class,
    'login',
]);

// Rotas protegidas por autenticação.
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [
        AuthController::class,
        'logout',
    ]);

});
