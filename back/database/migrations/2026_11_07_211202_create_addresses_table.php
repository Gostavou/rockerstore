<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('recipient_name', 120);
            $table->string('zip_code', 10);
            $table->string('street', 150);
            $table->string('number', 20);
            $table->string('complement', 150)->nullable();
            $table->string('district', 100);
            $table->string('city', 100);
            $table->char('state', 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
