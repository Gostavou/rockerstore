<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class CepService
{
    public function lookup(string $zipCode): array
    {
        $cep = str_replace('-', '', trim($zipCode));

        if (!preg_match('/^\d{8}$/', $cep)) {
            throw ValidationException::withMessages([
                'zip_code' => 'Informe um CEP válido com 8 dígitos.',
            ]);
        }

        return Cache::remember(
            "viacep:{$cep}",
            now()->addDay(),
            function () use ($cep): array {
                try {
                    $response = Http::acceptJson()
                        ->timeout(5)
                        ->get("https://viacep.com.br/ws/{$cep}/json/");
                } catch (ConnectionException) {
                    abort(
                        503,
                        'O serviço de CEP está temporariamente indisponível. Tente novamente.'
                    );
                }

                if (!$response->successful()) {
                    abort(
                        503,
                        'Não foi possível consultar o ViaCEP. Tente novamente.'
                    );
                }

                $result = $response->json();

                if (!is_array($result)) {
                    abort(503, 'O ViaCEP retornou uma resposta inválida.');
                }

                if (filter_var(
                    $result['erro'] ?? false,
                    FILTER_VALIDATE_BOOLEAN
                )) {
                    throw ValidationException::withMessages([
                        'zip_code' => 'CEP não encontrado.',
                    ]);
                }

                if (
                    empty($result['localidade']) ||
                    empty($result['uf'])
                ) {
                    abort(503, 'O ViaCEP retornou um endereço incompleto.');
                }

                return [
                    'zip_code' => substr($cep, 0, 5) . '-' . substr($cep, 5),
                    'street' => trim((string) ($result['logradouro'] ?? '')),
                    'district' => trim((string) ($result['bairro'] ?? '')),
                    'city' => trim((string) $result['localidade']),
                    'state' => strtoupper(trim((string) $result['uf'])),
                ];
            }
        );
    }
}
