<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
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


// CARRINHO DE COMPRAS

Route::get('/cart', [
    CartController::class,
    'index',
]);

Route::post('/cart/items', [
    CartController::class,
    'store',
]);

Route::put('/cart/items/{item}', [
    CartController::class,
    'update',
])->whereNumber('item');

Route::delete('/cart/items/{item}', [
    CartController::class,
    'destroy',
])->whereNumber('item');


// ROTAS AUTENTICADAS

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/auth/logout', [
        AuthController::class,
        'logout',
    ]);


    // PEDIDOS E CHECKOUT

    Route::post('/orders', [
        OrderController::class,
        'store',
    ]);

    Route::get('/orders', [
        OrderController::class,
        'index',
    ]);

    Route::get('/orders/{order}', [
        OrderController::class,
        'show',
    ])->whereNumber('order');

    Route::post('/orders/{order}/pay', [
        OrderController::class,
        'pay',
    ])->whereNumber('order');

    Route::post('/orders/{order}/cancel', [
        OrderController::class,
        'cancel',
    ])->whereNumber('order');


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


            // CATEGORIAS

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


            // PRODUTOS

            Route::post('/products', [
                ProductController::class,
                'store',
            ]);

            Route::get('/products', [
                ProductController::class,
                'indexAdmin',
            ]);

            Route::put('/products/{product}', [
                ProductController::class,
                'update',
            ])->whereNumber('product');

            Route::delete('/products/{product}', [
                ProductController::class,
                'destroy',
            ])->whereNumber('product');


            // GERENCIAMENTO DE PEDIDOS

            Route::get('/orders', [
                AdminOrderController::class,
                'index',
            ]);

            Route::get('/orders/{order}', [
                AdminOrderController::class,
                'show',
            ])->whereNumber('order');

            Route::patch('/orders/{order}/status', [
                AdminOrderController::class,
                'updateStatus',
            ])->whereNumber('order');

            Route::post('/orders/{order}/pay', [
                AdminOrderController::class,
                'pay',
            ])->whereNumber('order');

            Route::post('/orders/{order}/cancel', [
                AdminOrderController::class,
                'cancel',
            ])->whereNumber('order');

        });

});
