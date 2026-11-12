<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class AddressService
{
    public function list(int $userId): Collection
    {
        return Address::query()->where('user_id', $userId)->orderBy('id', 'desc')->get();
    }

    public function create(int $userId, array $data): Address
    {
        $data['user_id'] = $userId;
        return Address::create($data);
    }

    public function update(int $userId, int $addressId, array $data): Address
    {
        $address = Address::query()->where('user_id', $userId)->findOrFail($addressId);
        $address->update($data);

        return $address->refresh();
    }

    public function delete(int $userId, int $addressId): void
    {
        $address = Address::query()->where('user_id', $userId)->findOrFail($addressId);

        if (DB::table('orders')->where('address_id', $address->id)->exists()) {
            throw new ConflictHttpException(
                'Este endereço está vinculado a um pedido e não pode ser excluído.'
            );
        }

        $address->delete();
    }
}
