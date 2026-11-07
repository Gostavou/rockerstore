<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'RockerStore API',
        'status' => 'ok',
    ]);
});
