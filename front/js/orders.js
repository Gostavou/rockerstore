const $ = id => document.getElementById(id);
const ordersList = $('#ordersList');
const ordersMessage = $('#ordersMessage');
const detailsPanel = $('#detailsPanel');
const prevButton = $('#prevPage');
const nextButton = $('#nextPage');
const payButton = $('#payOrderButton');
const cancelButton = $('#cancelOrderButton');

const statusLabels = {
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pago',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
};

const statusClasses = {
    aguardando_pagamento: 'text-bg-warning',
    pago: 'text-bg-success',
    enviado: 'text-bg-info',
    entregue: 'text-bg-success',
    cancelado: 'text-bg-secondary'
};

let currentPage = 1;
let lastPage = 1;
let currentOrder = null;
let busy = false;

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

function formatDate(date) {
    return date
        ? new Date(date).toLocaleString('pt-BR')
        : 'Data indisponível';
}

function setMessage(text, type = 'danger') {
    ordersMessage.className = `alert alert-${type} mb-4`;
    ordersMessage.textContent = text;
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

function createStatusBadge(status) {
    return createElement(
        'span',
        statusLabels[status] ?? status,
        `badge ${statusClasses[status] ?? 'text-bg-secondary'}`
    );
}

function renderOrders(orders) {
    ordersList.replaceChildren();

    if (orders.length === 0) {
        ordersList.appendChild(
            createElement(
                'div',
                'Você ainda não possui pedidos.',
                'cart-empty text-center'
            )
        );
        return;
    }

    for (const order of orders) {
        const card = createElement('article', '', 'order-card mb-3');

        const content = createElement(
            'div',
            '',
            'd-flex justify-content-between align-items-center flex-wrap gap-3'
        );

        const info = createElement('div');

        info.append(
            createElement('h2', `Pedido #${order.id}`, 'h5 fw-bold'),
            createElement(
                'p',
                formatDate(order.created_at),
                'text-secondary small mb-2'
            ),
            createStatusBadge(order.status)
        );

        const actions = createElement('div', '', 'text-md-end');

        const total = createElement(
            'p',
            money(order.total_cents),
            'cart-item-total mb-2'
        );

        const button = createElement(
            'button',
            'Ver detalhes',
            'btn btn-outline-light btn-sm'
        );

        button.type = 'button';
        button.addEventListener('click', () => {
            loadOrderDetails(order.id);
        });

        actions.append(total, button);
        content.append(info, actions);
        card.appendChild(content);
        ordersList.appendChild(card);
    }
}

async function loadOrders() {
    const response = await apiRequest(`orders?page=${currentPage}`);

    renderOrders(response.data ?? []);

    lastPage = response.meta?.last_page ?? 1;

    $('#pageInfo').textContent =
        `Página ${currentPage} de ${lastPage}`;

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= lastPage;
}

function formatAddress(address) {
    if (!address || typeof address !== 'object') {
        return 'Endereço indisponível.';
    }

    return [
        address.recipient_name,
        [address.street, address.number].filter(Boolean).join(', '),
        address.complement,
        address.district,
        [address.city, address.state].filter(Boolean).join('/'),
        address.zip_code
    ].filter(Boolean).join(' — ');
}

function renderDetails(order) {
    currentOrder = order;
    detailsPanel.classList.remove('d-none');

    $('#detailsTitle').textContent = `Pedido #${order.id}`;

    const badge = createStatusBadge(order.status);
    const status = $('#detailsStatus');

    status.className = badge.className;
    status.textContent = badge.textContent;

    $('#detailsDate').textContent =
        `Criado em: ${formatDate(order.created_at)}`;

    $('#detailsAddress').textContent =
        formatAddress(order.address_snapshot);

    $('#detailsSubtotal').textContent =
        money(order.subtotal_cents);

    $('#detailsShipping').textContent =
        money(order.shipping_cents);

    $('#detailsTotal').textContent =
        money(order.total_cents);

    const itemsList = $('#detailsItems');
    itemsList.replaceChildren();

    for (const item of order.items ?? []) {
        itemsList.appendChild(
            createElement(
                'li',
                `${item.quantity}x ${item.product_name} — ${money(item.subtotal_cents)}`,
                'order-detail-item'
            )
        );
    }

    const pending = order.status === 'aguardando_pagamento';

    payButton.classList.toggle('d-none', !pending);
    cancelButton.classList.toggle('d-none', !pending);

    detailsPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

async function loadOrderDetails(orderId) {
    try {
        const response = await apiRequest(`orders/${orderId}`);
        renderDetails(response.data);
    } catch (error) {
        setMessage(error.message);
    }
}

async function changeOrder(action) {
    if (
        busy ||
        !currentOrder ||
        currentOrder.status !== 'aguardando_pagamento'
    ) {
        return;
    }

    if (
        action === 'cancel' &&
        !window.confirm('Deseja cancelar este pedido?')
    ) {
        return;
    }

    busy = true;
    payButton.disabled = true;
    cancelButton.disabled = true;

    try {
        const orderId = currentOrder.id;

        await apiRequest(`orders/${orderId}/${action}`, {
            method: 'POST'
        });

        await loadOrders();
        await loadOrderDetails(orderId);

        setMessage(
            action === 'pay'
                ? 'Pagamento simulado confirmado!'
                : 'Pedido cancelado com sucesso!',
            'success'
        );

    } catch (error) {
        setMessage(error.message);

    } finally {
        busy = false;
        payButton.disabled = false;
        cancelButton.disabled = false;
    }
}

async function changePage(direction) {
    const previousPage = currentPage;
    currentPage += direction;

    try {
        await loadOrders();
    } catch (error) {
        currentPage = previousPage;
        setMessage(error.message);
    }
}

async function initializeOrders() {
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

    $('#ordersPanel').classList.remove('d-none');

    try {
        await loadOrders();
    } catch (error) {
        setMessage(error.message);
    }
}

function bindEvents() {
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) changePage(-1);
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < lastPage) changePage(1);
    });

    payButton.addEventListener('click', () => {
        changeOrder('pay');
    });

    cancelButton.addEventListener('click', () => {
        changeOrder('cancel');
    });
}

bindEvents();
initializeOrders();
