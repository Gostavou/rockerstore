<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
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

Route::get('/categories', [
    CategoryController::class,
    'index',
]);


Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [
        AuthController::class,
        'logout',
    ]);

    Route::middleware('admin')
        ->prefix('admin')
        ->group(function () {

            Route::get('/check', function () {
                return response()->json([
                    'message' => 'Acesso administrativo autorizado.',
                ]);
            });

            Route::post('/categories', [
                CategoryController::class,
                'store',
            ]);

            Route::put('/categories/{category}', [
                CategoryController::class,
                'update',
            ]);

            Route::delete('/categories/{category}', [
                CategoryController::class,
                'destroy',
            ]);

        });

});
