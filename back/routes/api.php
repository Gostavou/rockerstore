<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [
    AuthController::class,
    'register',
]);

Route::post('/auth/login', [
    AuthController::class,
    'login',
]);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [
        AuthController::class,
        'logout',
    ]);

    Route::middleware('admin')->prefix('admin')->group(function () {

        Route::get('/check', function () {
            return response()->json([
                'message' => 'Acesso administrativo autorizado.',
            ]);
        });

    });

});
