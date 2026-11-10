<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class GuestCartSessionService
{
    private const COOKIE_NAME = 'rockerstore_guest_cart';

    public function token(Request $request): string
    {
        $token = $request->cookie(self::COOKIE_NAME);

        if (
            is_string($token) &&
            preg_match('/\A[a-f0-9]{64}\z/', $token)
        ) {
            return $token;
        }

        $token = bin2hex(random_bytes(32));

        Cookie::queue(cookie(
            self::COOKIE_NAME,
            $token,
            60 * 24 * 30,
            '/',
            null,
            config('session.secure'),
            true,
            false,
            'lax'
        ));

        return $token;
    }


    public function existingToken(Request $request): ?string
    {
        $token = $request->cookie(self::COOKIE_NAME);

        if (
            is_string($token) &&
            preg_match('/\A[a-f0-9]{64}\z/', $token) === 1
        ) {
            return $token;
        }

        return null;
    }

    public function forget(): void
    {
        Cookie::queue(
            Cookie::forget(self::COOKIE_NAME)
        );
    }

}
