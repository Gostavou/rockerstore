<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CepService;
use Illuminate\Http\JsonResponse;

class CepController extends Controller
{
    public function show(
        string $cep,
        CepService $cepService
    ): JsonResponse {
        return response()->json([
            'data' => $cepService->lookup($cep),
        ]);
    }
}
