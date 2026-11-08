<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ROTAS PÚBLICAS

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

Route::get('/products', [
    ProductController::class,
    'index',
]);

Route::get('/products/{product}', [
    ProductController::class,
    'show',
])->whereNumber('product');


// ROTAS AUTENTICADAS

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [
        AuthController::class,
        'logout',
    ]);

    // ENDEREÇOS DO CLIENTE

    Route::get('/addresses', [
        AddressController::class,
        'index',
    ]);

    Route::post('/addresses', [
        AddressController::class,
        'store',
    ]);

    Route::put('/addresses/{address}', [
        AddressController::class,
        'update',
    ])->whereNumber('address');

    Route::delete('/addresses/{address}', [
        AddressController::class,
        'destroy',
    ])->whereNumber('address');


    // ROTAS ADMINISTRATIVAS

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

            Route::post('/products', [
                ProductController::class,
                'store',
            ]);

            Route::put('/products/{product}', [
                ProductController::class,
                'update',
            ])->whereNumber('product');

            Route::delete('/products/{product}', [
                ProductController::class,
                'destroy',
            ])->whereNumber('product');

        });

});
