
const cartItems = document.querySelector('#cartItems');
const cartMessage = document.querySelector('#cartMessage');
const cartSubtotal = document.querySelector('#cartSubtotal');
const cartUnits = document.querySelector('#cartUnits');
const cartCount = document.querySelector('#cartCount');
const checkoutLink = document.querySelector('#checkoutLink');

let currentCart = null;
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

function setMessage(text, type = 'danger') {
    cartMessage.className = `alert alert-${type}`;
    cartMessage.textContent = text;
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
        const errors = Object.values(result.errors ?? {})
            .flat().join(' ');

        const error = new Error(
            errors || result.message || `Erro HTTP ${response.status}`
        );

        error.status = response.status;
        throw error;
    }

    return result;
}

async function changeCart(path, method, data, successMessage) {
    if (busy) return;

    busy = true;

    cartItems.querySelectorAll('button').forEach(button => {
        button.disabled = true;
    });

    try {
        const response = await apiRequest(path, {
            method,
            ...(data !== null ? { data } : {})
        });

        currentCart = response.data;
        renderCart(currentCart);
        setMessage(successMessage, 'success');

    } catch (error) {
        if (currentCart) renderCart(currentCart);
        setMessage(error.message);

    } finally {
        busy = false;
    }
}

async function updateQuantity(itemId, quantity, stock) {
    if (!Number.isInteger(quantity) || quantity < 1) {
        setMessage('Informe uma quantidade válida.');
        return;
    }

    if (quantity > stock) {
        setMessage('A quantidade supera o estoque disponível.');
        return;
    }

    await changeCart(
        `cart/items/${itemId}`,
        'PUT',
        { quantity },
        'Quantidade atualizada com sucesso!'
    );
}

async function removeItem(itemId) {
    if (!window.confirm('Deseja remover este produto do carrinho?')) {
        return;
    }

    await changeCart(
        `cart/items/${itemId}`,
        'DELETE',
        null,
        'Produto removido do carrinho!'
    );
}

function createCartItem(item) {
    const product = item.product;
    const name = product?.name ?? 'Produto indisponível';
    const price = product?.price_cents ?? 0;
    const stock = product?.stock_quantity ?? 0;
    const available = Boolean(product && product.is_active && stock > 0);

    const card = createElement('article', '', 'cart-item mb-3');
    const row = createElement('div', '', 'row g-3 align-items-center');

    const imageColumn = createElement('div', '', 'col-sm-3');
    const image = createElement('div', '🎸', 'cart-image');
    image.setAttribute('aria-hidden', 'true');
    imageColumn.appendChild(image);

    const infoColumn = createElement('div', '', 'col-sm-6');

    const title = createElement('h2', name, 'h5 fw-bold');
    const unitPrice = createElement(
        'p',
        `Preço unitário: ${money(price)}`,
        'text-secondary mb-2'
    );

    const stockInfo = createElement(
        'p',
        available ? `Estoque disponível: ${stock}` : 'Produto indisponível',
        'small text-secondary mb-2'
    );

    const quantityLabel = createElement(
        'label', 'Quantidade', 'form-label small'
    );

    const quantityInput = createElement(
        'input', '', 'form-control cart-quantity'
    );

    quantityInput.type = 'number';
    quantityInput.id = `quantity-${item.id}`;
    quantityInput.min = '1';
    quantityInput.max = String(stock);
    quantityInput.step = '1';
    quantityInput.value = String(item.quantity);
    quantityInput.disabled = !available;

    quantityLabel.htmlFor = quantityInput.id;

    const saveButton = createElement(
        'button', 'Atualizar', 'btn btn-outline-light btn-sm'
    );

    saveButton.type = 'button';
    saveButton.disabled = !available;

    saveButton.addEventListener('click', () => {
        updateQuantity(item.id, Number(quantityInput.value), stock);
    });

    const quantityGroup = document.createElement('div');
    quantityGroup.append(quantityLabel, quantityInput);

    const quantityControls = createElement(
        'div', '', 'd-flex align-items-end gap-2 flex-wrap'
    );

    quantityControls.append(quantityGroup, saveButton);
    infoColumn.append(title, unitPrice, stockInfo, quantityControls);

    const actionColumn = createElement(
        'div', '', 'col-sm-3 text-sm-end'
    );

    const lineTotal = createElement(
        'p', money(item.line_total_cents), 'cart-item-total'
    );

    const removeButton = createElement(
        'button', 'Remover', 'btn btn-outline-danger btn-sm'
    );

    removeButton.type = 'button';
    removeButton.addEventListener('click', () => removeItem(item.id));

    actionColumn.append(lineTotal, removeButton);
    row.append(imageColumn, infoColumn, actionColumn);
    card.appendChild(row);

    return card;
}

function renderCart(cart) {
    cartItems.replaceChildren();

    const items = cart.items ?? [];
    const totalQuantity = items.reduce(
        (total, item) => total + item.quantity, 0
    );

    cartCount.textContent = totalQuantity;
    cartUnits.textContent = totalQuantity;
    cartSubtotal.textContent = money(cart.subtotal_cents);

    checkoutLink.classList.toggle('disabled', items.length === 0);
    checkoutLink.setAttribute(
        'aria-disabled',
        String(items.length === 0)
    );
    checkoutLink.tabIndex = items.length === 0 ? -1 : 0;

    if (items.length === 0) {
        const empty = createElement(
            'div',
            'Seu carrinho está vazio.',
            'cart-empty text-center'
        );

        const link = createElement(
            'a',
            'Explorar produtos',
            'btn btn-danger mt-3'
        );

        link.href = '/#catalogo';
        empty.append(document.createElement('br'), link);
        cartItems.appendChild(empty);
        return;
    }

    for (const item of items) {
        cartItems.appendChild(createCartItem(item));
    }
}

async function loadCart() {
    try {
        const response = await apiRequest('cart');
        currentCart = response.data;
        renderCart(currentCart);
    } catch (error) {
        setMessage(error.message);
    }
}

function initializeCart() {
    loadCart();
}

initializeCart();
