<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class AddressService
{
    public function __construct(
        private CepService $cepService
    ) {
    }

    public function list(int $userId): Collection
    {
        return Address::query()
            ->where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->get();
    }

    private function validateAddress(array $data): array
    {
        $cep = $this->cepService->lookup($data['zip_code']);

        $data['zip_code'] = $cep['zip_code'];
        $data['city'] = $cep['city'];
        $data['state'] = $cep['state'];

        if ($cep['street'] !== '') {
            $data['street'] = $cep['street'];
        }

        if ($cep['district'] !== '') {
            $data['district'] = $cep['district'];
        }

        return $data;
    }

    public function create(int $userId, array $data): Address
    {
        $data = $this->validateAddress($data);
        $data['user_id'] = $userId;

        return Address::create($data);
    }

    public function update(
        int $userId,
        int $addressId,
        array $data
    ): Address {
        $address = Address::query()
            ->where('user_id', $userId)
            ->findOrFail($addressId);

        $currentData = $address->only([
            'recipient_name',
            'zip_code',
            'street',
            'number',
            'complement',
            'district',
            'city',
            'state',
        ]);

        $data = array_merge($currentData, $data);
        $data = $this->validateAddress($data);

        $address->update($data);

        return $address->refresh();
    }

    public function delete(int $userId, int $addressId): void
    {
        $address = Address::query()
            ->where('user_id', $userId)
            ->findOrFail($addressId);

        if (
            DB::table('orders')
                ->where('address_id', $address->id)
                ->exists()
        ) {
            throw new ConflictHttpException(
                'Este endereço está vinculado a um pedido e não pode ser excluído.'
            );
        }

        $address->delete();
    }
}
