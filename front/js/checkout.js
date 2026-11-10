const $ = id => document.getElementById(id);
const checkoutMessage = $('#checkoutMessage');
const addressSelect = $('#addressSelect');
const addressForm = $('#addressForm');
const orderForm = $('#orderForm');
const payButton = $('#payButton');

const SHIPPING_CENTS = 1500;

const statusLabels = {
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pago',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
};

const money = cents => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(Number(cents ?? 0) / 100);

function createElement(tag, value = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = value;
    element.className = className;
    return element;
}

function setMessage(text, type = 'danger') {
    checkoutMessage.className = `alert alert-${type}`;
    checkoutMessage.textContent = text;
}

function getXsrfToken() {
    const cookie = document.cookie.split('; ')
        .find(item => item.startsWith('XSRF-TOKEN='));

    return cookie
        ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length))
        : null;
}

async function apiRequest(path, options = {}) {
    const method = (options.method ?? 'GET').toUpperCase();
    const headers = { Accept: 'application/json' };

    if (method !== 'GET') {
        const csrf = await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });

        if (!csrf.ok) {
            throw new Error('Não foi possível obter o token CSRF.');
        }

        const token = getXsrfToken();
        if (!token) throw new Error('Token CSRF indisponível.');

        headers['X-XSRF-TOKEN'] = token;
    }

    if (options.data !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/api/${path}`, {
        method,
        credentials: 'same-origin',
        headers,
        body: options.data !== undefined
            ? JSON.stringify(options.data)
            : undefined
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validation = Object.values(result.errors ?? {})
            .flat().join(' ');

        const error = new Error(
            validation || result.message || `Erro HTTP ${response.status}`
        );

        error.status = response.status;
        throw error;
    }

    return result;
}

function renderSummary(cart) {
    const list = $('#summaryItems');
    list.replaceChildren();

    for (const item of cart.items ?? []) {
        const name = item.product?.name ?? 'Produto indisponível';

        list.appendChild(
            createElement(
                'li',
                `${item.quantity}x ${name} — ${money(item.line_total_cents)}`,
                'mb-2'
            )
        );
    }

    $('#subtotalText').textContent = money(cart.subtotal_cents);
    $('#shippingText').textContent = money(SHIPPING_CENTS);
    $('#totalText').textContent = money(
        cart.subtotal_cents + SHIPPING_CENTS
    );
}

function renderAddresses(addresses, selectedId = null) {
    addressSelect.replaceChildren(
        new Option('Selecione um endereço', '')
    );

    for (const address of addresses) {
        const label = [
            address.recipient_name,
            `${address.street}, ${address.number}`,
            `${address.city}/${address.state}`
        ].join(' — ');

        addressSelect.add(new Option(label, address.id));
    }

    if (selectedId !== null) {
        addressSelect.value = String(selectedId);
    } else if (addresses.length > 0) {
        addressSelect.value = String(addresses[0].id);
    }

    $('#createOrderButton').disabled = !addressSelect.value;

    if (addresses.length === 0) {
        addressForm.classList.remove('d-none');
    }
}

async function loadAddresses(selectedId = null) {
    const response = await apiRequest('addresses');
    renderAddresses(response.data ?? [], selectedId);
}

function renderOrder(order) {
    $('#addressPanel').classList.add('d-none');
    $('#summaryPanel').classList.add('d-none');
    $('#emptyNotice').classList.add('d-none');
    $('#orderPanel').classList.remove('d-none');

    $('#orderId').textContent = order.id;
    $('#orderStatus').textContent =
        statusLabels[order.status] ?? order.status;
    $('#orderTotal').textContent = money(order.total_cents);

    const list = $('#orderItems');
    list.replaceChildren();

    for (const item of order.items ?? []) {
        list.appendChild(
            createElement(
                'li',
                `${item.quantity}x ${item.product_name} — ${money(item.subtotal_cents)}`,
                'mb-2'
            )
        );
    }

    const pending = order.status === 'aguardando_pagamento';

    payButton.classList.toggle('d-none', !pending);
    payButton.dataset.orderId = order.id;

    $('#paymentMessage').textContent = pending
        ? 'O pedido foi criado. O pagamento ainda está pendente.'
        : order.status === 'pago'
            ? 'Pagamento simulado confirmado.'
            : `Status atual: ${statusLabels[order.status] ?? order.status}`;
}

async function loadCheckout() {
    try {
        await apiRequest('user');
    } catch (error) {
        if (error.status === 401) {
            $('#loginNotice').classList.remove('d-none');
        } else {
            setMessage(error.message);
        }
        return;
    }

    const orderId = new URLSearchParams(
        window.location.search
    ).get('order');

    if (orderId !== null) {
        if (!/^[1-9]\d*$/.test(orderId)) {
            setMessage('Número de pedido inválido.');
            return;
        }

        try {
            const response = await apiRequest(`orders/${orderId}`);
            renderOrder(response.data);
        } catch (error) {
            setMessage(error.message);
        }
        return;
    }

    try {
        const [cartResponse, addressResponse] = await Promise.all([
            apiRequest('cart'),
            apiRequest('addresses')
        ]);

        const cart = cartResponse.data;

        if (!cart.items || cart.items.length === 0) {
            $('#emptyNotice').classList.remove('d-none');
            return;
        }

        renderSummary(cart);
        renderAddresses(addressResponse.data ?? []);

        $('#addressPanel').classList.remove('d-none');
        $('#summaryPanel').classList.remove('d-none');

    } catch (error) {
        setMessage(error.message);
    }
}

async function saveAddress(event) {
    event.preventDefault();

    const button = $('#saveAddressButton');
    const data = Object.fromEntries(new FormData(addressForm));

    data.state = data.state.trim().toUpperCase();
    data.complement = data.complement.trim() || null;

    button.disabled = true;

    try {
        const response = await apiRequest('addresses', {
            method: 'POST',
            data
        });

        await loadAddresses(response.data.id);

        addressForm.reset();
        addressForm.classList.add('d-none');
        setMessage('Endereço cadastrado com sucesso!', 'success');

    } catch (error) {
        setMessage(error.message);
    } finally {
        button.disabled = false;
    }
}

async function createOrder(event) {
    event.preventDefault();

    const addressId = Number(addressSelect.value);

    if (!Number.isInteger(addressId) || addressId < 1) {
        setMessage('Selecione um endereço.');
        return;
    }

    const button = $('#createOrderButton');
    button.disabled = true;

    try {
        const response = await apiRequest('orders', {
            method: 'POST',
            data: { address_id: addressId }
        });

        const order = response.data;

        window.history.replaceState(
            {},
            '',
            `/checkout.html?order=${order.id}`
        );

        renderOrder(order);
        setMessage('Pedido criado com sucesso!', 'success');

    } catch (error) {
        setMessage(error.message);
    } finally {
        button.disabled = false;
    }
}

async function payOrder() {
    const orderId = payButton.dataset.orderId;
    if (!orderId) return;

    payButton.disabled = true;

    try {
        const response = await apiRequest(`orders/${orderId}/pay`, {
            method: 'POST'
        });

        renderOrder(response.data);
        setMessage('Pagamento simulado realizado com sucesso!', 'success');

    } catch (error) {
        setMessage(error.message);
    } finally {
        payButton.disabled = false;
    }
}

function bindEvents() {
    $('#newAddressButton').addEventListener('click', () => {
        addressForm.classList.toggle('d-none');
    });

    addressSelect.addEventListener('change', () => {
        $('#createOrderButton').disabled = !addressSelect.value;
    });

    addressForm.addEventListener('submit', saveAddress);
    orderForm.addEventListener('submit', createOrder);
    payButton.addEventListener('click', payOrder);
}

function initializeCheckout() {
    bindEvents();
    loadCheckout();
}

initializeCheckout();
