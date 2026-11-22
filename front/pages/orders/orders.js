import '../../components/header.js';

const $ = selector => document.querySelector(selector);
const ordersList = $('#ordersList');
const ordersMessage = $('#ordersMessage');
const detailsPanel = $('#detailsPanel');
const prevButton = $('#prevPage');
const nextButton = $('#nextPage');
const payButton = $('#payOrderButton');
const cancelButton = $('#cancelOrderButton');
const refreshOrderButton = $('#refreshOrderButton');

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

const trackingSteps = [
    'Pedido realizado',
    'Pagamento',
    'Enviado',
    'Entregue'
];

const trackingPositions = {
    aguardando_pagamento: 0,
    pago: 1,
    enviado: 2,
    entregue: 3
};

const trackingMessages = {
    aguardando_pagamento:
        'O pedido foi registrado e está aguardando o pagamento simulado.',
    pago:
        'O pagamento foi confirmado. O pedido aguarda o envio.',
    enviado:
        'O pedido foi enviado e aguarda a confirmação da entrega.',
    entregue:
        'O pedido foi entregue. Todas as etapas foram concluídas.',
    cancelado:
        'Este pedido foi cancelado antes do pagamento. O acompanhamento foi encerrado.'
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

        if (!token) {
            throw new Error('Token CSRF indisponível.');
        }

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
            .flat()
            .join(' ');

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

function createOrderProgress(order) {
    const container = createElement(
        'div', '', 'order-progress-preview'
    );

    if (order.status === 'cancelado') {
        container.appendChild(
            createElement(
                'span',
                'Pedido cancelado — acompanhamento encerrado',
                'order-progress-cancelled'
            )
        );
        return container;
    }

    const position = trackingPositions[order.status];

    if (position === undefined) {
        return container;
    }

    const label = createElement(
        'p',
        `Etapa ${position + 1} de 4 — ${trackingSteps[position]}`,
        'order-progress-caption'
    );

    const segments = createElement(
        'div', '', 'order-progress-segments'
    );

    segments.setAttribute('role', 'img');
    segments.setAttribute('aria-label', label.textContent);

    for (let index = 0; index < trackingSteps.length; index++) {
        const segment = createElement(
            'span', '', 'order-progress-segment'
        );

        if (index <= position) {
            segment.classList.add('is-filled');
        }

        segments.appendChild(segment);
    }

    container.append(label, segments);
    return container;
}

function renderOrderTracking(order) {
    const container = $('#orderTracking');

    if (!container) return;

    container.replaceChildren();

    const title = createElement(
        'h3',
        'Acompanhamento do pedido',
        'h5 fw-bold mb-2'
    );

    const description = createElement(
        'p',
        trackingMessages[order.status] ??
            'Consulte o status atual do pedido.',
        'order-tracking-description'
    );

    if (order.status === 'cancelado') {
        description.classList.add('is-cancelled');
    }

    container.append(title, description);

    if (order.status === 'cancelado') {
        const cancelled = createElement(
            'div',
            'Pedido cancelado',
            'order-tracking-cancelled'
        );
        container.appendChild(cancelled);
        return;
    }

    const currentPosition = trackingPositions[order.status];

    if (currentPosition === undefined) return;

    const delivered = order.status === 'entregue';
    const steps = createElement(
        'ol', '', 'order-tracking-steps'
    );

    for (let index = 0; index < trackingSteps.length; index++) {
        const step = createElement(
            'li', '', 'order-tracking-step'
        );

        const completed = delivered || index < currentPosition;
        const current = !delivered && index === currentPosition;

        if (completed) {
            step.classList.add('is-complete');
        } else if (current) {
            step.classList.add('is-current');
            step.setAttribute('aria-current', 'step');
        }

        const marker = createElement(
            'span',
            completed ? '✓' : String(index + 1),
            'order-tracking-marker'
        );

        marker.setAttribute('aria-hidden', 'true');

        const content = createElement(
            'div', '', 'order-tracking-step-content'
        );

        const label = createElement(
            'strong', trackingSteps[index],
            'order-tracking-label'
        );

        content.appendChild(label);

        if (index === 0 && order.created_at) {
            content.appendChild(
                createElement(
                    'span',
                    `Criado em ${formatDate(order.created_at)}`,
                    'order-tracking-date'
                )
            );
        }

        if (index === 1 && order.paid_at) {
            content.appendChild(
                createElement(
                    'span',
                    `Pago em ${formatDate(order.paid_at)}`,
                    'order-tracking-date'
                )
            );
        }

        step.append(marker, content);
        steps.appendChild(step);
    }

    container.appendChild(steps);
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
        const card = createElement(
            'article', '', 'order-card mb-3'
        );

        const content = createElement(
            'div',
            '',
            'd-flex justify-content-between align-items-center flex-wrap gap-3'
        );

        const info = createElement('div');

        info.append(
            createElement(
                'h2',
                `Pedido #${order.id}`,
                'h5 fw-bold'
            ),
            createElement(
                'p',
                formatDate(order.created_at),
                'text-secondary small mb-2'
            ),
            createStatusBadge(order.status)
        );

        const actions = createElement('div', '', 'text-md-end');

        const total = createElement(
            'p', money(order.total_cents),
            'cart-item-total mb-2'
        );

        const button = createElement(
            'button', 'Ver detalhes',
            'btn btn-outline-light btn-sm'
        );

        button.type = 'button';
        button.addEventListener('click', () => {
            loadOrderDetails(order.id);
        });

        actions.append(total, button);
        content.append(info, actions);

        card.append(content, createOrderProgress(order));
        ordersList.appendChild(card);
    }
}

async function loadOrders() {
    const response = await apiRequest(
        `orders?page=${currentPage}`
    );

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

    $('#detailsTitle').textContent =
        `Pedido #${order.id}`;

    const badge = createStatusBadge(order.status);
    const status = $('#detailsStatus');

    status.className = badge.className;
    status.textContent = badge.textContent;

    $('#detailsDate').textContent =
        `Criado em: ${formatDate(order.created_at)}`;

    renderOrderTracking(order);

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
        const response = await apiRequest(
            `orders/${orderId}`
        );

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

        await apiRequest(
            `orders/${orderId}/${action}`,
            { method: 'POST' }
        );

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
        if (currentPage > 1) {
            changePage(-1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < lastPage) {
            changePage(1);
        }
    });

    payButton.addEventListener('click', () => {
        changeOrder('pay');
    });

    cancelButton.addEventListener('click', () => {
        changeOrder('cancel');
    });

    refreshOrderButton.addEventListener('click', async () => {
        if (!currentOrder || busy || refreshOrderButton.disabled) {
            return;
        }

        refreshOrderButton.disabled = true;

        try {
            await loadOrders();
            await loadOrderDetails(currentOrder.id);
        } catch (error) {
            setMessage(error.message);
        } finally {
            refreshOrderButton.disabled = false;
        }
    });
}

bindEvents();
initializeOrders();
