export function bindCepLookup(form) {
    const zipInput = form.elements.namedItem('zip_code');

    const fieldNames = [
        'street',
        'district',
        'city',
        'state'
    ];

    const status = document.createElement('small');

    status.setAttribute('role', 'status');
    zipInput.insertAdjacentElement('afterend', status);

    zipInput.maxLength = 9;
    zipInput.inputMode = 'numeric';
    zipInput.autocomplete = 'postal-code';

    let timer = null;
    let activeController = null;
    let resolvedCep = null;

    function getDigits() {
        return zipInput.value.replace(/\D/g, '');
    }

    function setStatus(message, type = 'secondary') {
        status.textContent = message;
        status.className = `d-block form-text mt-2 text-${type}`;
    }

    function cancelLookup() {
        clearTimeout(timer);

        if (activeController) {
            activeController.abort();
            activeController = null;
        }
    }

    function clearAddressFields() {
        for (const name of fieldNames) {
            const input = form.elements.namedItem(name);

            if (!input) continue;

            input.value = '';
            input.readOnly = false;
        }
    }

    async function lookupCep() {
        const cep = getDigits();

        if (cep.length !== 8) return;

        cancelLookup();

        const controller = new AbortController();

        activeController = controller;

        setStatus('Consultando CEP...');

        try {
            const response = await fetch(`/api/cep/${cep}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json'
                },
                signal: controller.signal
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const validation = Object.values(
                    result.errors ?? {}
                ).flat().join(' ');

                throw new Error(
                    validation ||
                    result.message ||
                    `Erro HTTP ${response.status}`
                );
            }

            if (
                controller.signal.aborted ||
                getDigits() !== cep
            ) {
                return;
            }

            const address = result.data;

            if (
                !address ||
                !address.zip_code ||
                !address.city ||
                !address.state
            ) {
                throw new Error(
                    'O serviço retornou dados incompletos.'
                );
            }

            zipInput.value = address.zip_code;

            for (const name of fieldNames) {
                const input = form.elements.namedItem(name);

                if (!input) continue;

                const value = String(address[name] ?? '');

                input.value = value;
                input.readOnly = value.length > 0;
            }

            resolvedCep = cep;

            setStatus(
                'CEP encontrado! Confira o número e o complemento.',
                'success'
            );

        } catch (error) {
            if (controller.signal.aborted) return;

            setStatus(
                error.message || 'Não foi possível consultar o CEP.',
                'danger'
            );

        } finally {
            if (activeController === controller) {
                activeController = null;
            }
        }
    }

    zipInput.addEventListener('input', () => {
        cancelLookup();

        resolvedCep = null;

        const digits = getDigits().slice(0, 8);

        zipInput.value = digits.length > 5
            ? `${digits.slice(0, 5)}-${digits.slice(5)}`
            : digits;

        clearAddressFields();

        if (digits.length === 8) {
            setStatus('Buscando endereço...');

            timer = setTimeout(lookupCep, 400);
        } else if (digits.length > 0) {
            setStatus('Informe os 8 dígitos do CEP.');
        } else {
            setStatus('');
        }
    });

    zipInput.addEventListener('blur', () => {
        const cep = getDigits();

        if (cep.length === 8 && resolvedCep !== cep) {
            lookupCep();
        }
    });

    form.addEventListener('reset', () => {
        cancelLookup();

        resolvedCep = null;

        setStatus('');

        for (const name of fieldNames) {
            const input = form.elements.namedItem(name);

            if (input) {
                input.readOnly = false;
            }
        }
    });
}
