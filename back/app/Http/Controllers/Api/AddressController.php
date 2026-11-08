<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Address\StoreAddressRequest;
use App\Http\Requests\Address\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Services\AddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AddressController extends Controller
{
    public function __construct(
        private AddressService $addressService
    ) {
    }

    public function index(
        Request $request
    ): AnonymousResourceCollection {
        $addresses = $this->addressService->list(
            $request->user()->id
        );

        return AddressResource::collection($addresses);
    }

    public function store(
        StoreAddressRequest $request
    ): JsonResponse {
        $address = $this->addressService->create(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Endereço cadastrado com sucesso.',
            'data' => new AddressResource($address),
        ], 201);
    }

    public function update(
        UpdateAddressRequest $request,
        int $address
    ): JsonResponse {
        $updatedAddress = $this->addressService->update(
            $request->user()->id,
            $address,
            $request->validated()
        );

        return response()->json([
            'message' => 'Endereço atualizado com sucesso.',
            'data' => new AddressResource($updatedAddress),
        ], 200);
    }

    public function destroy(
        Request $request,
        int $address
    ): JsonResponse {
        $this->addressService->delete(
            $request->user()->id,
            $address
        );

        return response()->json([
            'message' => 'Endereço excluído com sucesso.',
        ], 200);
    }
}
