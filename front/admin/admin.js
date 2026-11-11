import '../js/auth.js';

const statusElement = document.querySelector('#admin-status');
const dashboard = document.querySelector('#admin-dashboard');
const productsList = document.querySelector('#admin-products-list');
const categoriesList = document.querySelector('#admin-categories-list');
const ordersBody = document.querySelector('#admin-orders-body');
const ordersCount = document.querySelector('#admin-orders-count');
const detailsSection = document.querySelector('#admin-order-details');
const detailsContent = document.querySelector('#admin-order-content');
const orderActions = document.querySelector('#admin-order-actions');
const productForm = document.querySelector('#product-form');
const categoryForm = document.querySelector('#category-form');

const statusLabels = {
    aguardando_pagamento: 'Aguardando pagamento',
    pago: 'Pago',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado'
};

let categories = [];
let editingProductId = null;
let editingCategoryId = null;
let currentOrder = null;
let productsPage = 1;
let productsLastPage = 1;
let ordersPage = 1;
let ordersLastPage = 1;
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

function setStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.className = isError
        ? 'admin-error'
        : 'admin-success';
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
        const csrfResponse = await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });

        if (!csrfResponse.ok) {
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

async function executeAction(action) {
    if (busy) return;

    busy = true;

    try {
        await action();
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        busy = false;
    }
}

function createButton(label, className, action) {
    const button = createElement('button', label, className);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
}

function addDetail(parent, label, value) {
    const row = createElement('div', '', 'admin-detail-row');

    row.append(
        createElement('span', label),
        createElement('strong', String(value ?? '—'))
    );

    parent.appendChild(row);
}

function changeTab(name) {
    const names = ['products', 'categories', 'orders'];

    for (const tab of document.querySelectorAll('[data-tab]')) {
        const active = tab.dataset.tab === name;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
    }

    for (const section of names) {
        document.querySelector(`#${section}-section`).hidden =
            section !== name;
    }
}

function resetCategoryForm() {
    editingCategoryId = null;
    categoryForm.reset();

    document.querySelector('#category-form-title').textContent =
        'Cadastrar categoria';

    document.querySelector('#cancel-category-edit').hidden = true;
}

function renderCategories() {
    categoriesList.replaceChildren();

    if (categories.length === 0) {
        categoriesList.textContent = 'Nenhuma categoria cadastrada.';
        return;
    }

    for (const category of categories) {
        const row = createElement('div', '', 'admin-list-row');
        const info = document.createElement('div');
        const name = createElement('strong', category.name);
        const slug = createElement(
            'p', category.slug, 'text-secondary small mb-0'
        );

        info.append(name, slug);

        const actions = createElement('div', '', 'd-flex gap-2');

        const edit = createButton(
            'Editar',
            'btn btn-outline-light btn-sm',
            () => {
                editingCategoryId = category.id;

                document.querySelector('#category-name').value =
                    category.name;

                document.querySelector('#category-form-title').textContent =
                    'Editar categoria';

                document.querySelector('#cancel-category-edit').hidden =
                    false;

                categoryForm.scrollIntoView({ behavior: 'smooth' });
            }
        );

        const remove = createButton(
            'Excluir',
            'btn btn-outline-danger btn-sm',
            () => deleteCategory(category.id)
        );

        actions.append(edit, remove);
        row.append(info, actions);
        categoriesList.appendChild(row);
    }
}

function fillCategoriesSelect() {
    const select = document.querySelector('#product-category');
    const selected = select.value;

    select.replaceChildren(new Option('Selecione', ''));

    for (const category of categories) {
        select.add(new Option(category.name, category.id));
    }

    select.value = selected;
}

async function loadCategories() {
    const response = await apiRequest('categories');

    categories = response.data ?? [];
    renderCategories();
    fillCategoriesSelect();
}

async function saveCategory(event) {
    event.preventDefault();

    await executeAction(async () => {
        const name = document.querySelector('#category-name').value.trim();
        const editing = editingCategoryId !== null;

        await apiRequest(
            editing
                ? `admin/categories/${editingCategoryId}`
                : 'admin/categories',
            {
                method: editing ? 'PUT' : 'POST',
                data: { name }
            }
        );

        resetCategoryForm();
        await loadCategories();
        await loadProducts();
        setStatus('Categoria salva com sucesso.');
    });
}

async function deleteCategory(id) {
    if (!confirm('Deseja excluir esta categoria?')) return;

    await executeAction(async () => {
        await apiRequest(`admin/categories/${id}`, {
            method: 'DELETE'
        });

        if (editingCategoryId === id) resetCategoryForm();

        await loadCategories();
        await loadProducts();
        setStatus('Categoria excluída com sucesso.');
    });
}

function resetProductForm() {
    editingProductId = null;
    productForm.reset();

    document.querySelector('#product-active').checked = true;
    document.querySelector('#product-form-title').textContent =
        'Cadastrar produto';

    document.querySelector('#cancel-product-edit').hidden = true;
}

function editProduct(product) {
    editingProductId = product.id;

    document.querySelector('#product-name').value = product.name;
    document.querySelector('#product-category').value =
        product.category?.id ?? '';

    document.querySelector('#product-description').value =
        product.description ?? '';

    document.querySelector('#product-price').value =
        (product.price_cents / 100).toFixed(2);

    document.querySelector('#product-stock').value =
        product.stock_quantity;

    document.querySelector('#product-image').value =
        product.image_path ?? '';

    document.querySelector('#product-active').checked =
        Boolean(product.is_active);

    document.querySelector('#product-form-title').textContent =
        'Editar produto';

    document.querySelector('#cancel-product-edit').hidden = false;

    productForm.scrollIntoView({ behavior: 'smooth' });
}

function renderProducts(products) {
    productsList.replaceChildren();

    if (products.length === 0) {
        productsList.textContent = 'Nenhum produto encontrado.';
        return;
    }

    for (const product of products) {
        const row = createElement('div', '', 'admin-list-row');
        const info = document.createElement('div');
        const name = createElement('strong', product.name);

        const status = createElement(
            'span',
            product.is_active ? 'Ativo' : 'Inativo',
            `badge ms-2 ${product.is_active
                ? 'text-bg-success'
                : 'text-bg-secondary'}`
        );

        name.appendChild(status);

        const description = createElement(
            'p',
            `${product.category?.name ?? 'Sem categoria'} | ${money(product.price_cents)} | Estoque: ${product.stock_quantity}`,
            'text-secondary small mb-0'
        );

        info.append(name, description);

        const actions = createElement('div', '', 'd-flex gap-2');

        const edit = createButton(
            'Editar',
            'btn btn-outline-light btn-sm',
            () => editProduct(product)
        );

        const remove = createButton(
            'Excluir',
            'btn btn-outline-danger btn-sm',
            () => deleteProduct(product.id)
        );

        actions.append(edit, remove);
        row.append(info, actions);
        productsList.appendChild(row);
    }
}

async function loadProducts() {
    const response = await apiRequest(
        `admin/products?page=${productsPage}`
    );

    productsLastPage = response.meta?.last_page ?? 1;

    if (productsPage > productsLastPage) {
        productsPage = productsLastPage;
        return loadProducts();
    }

    renderProducts(response.data ?? []);

    document.querySelector('#products-page').textContent =
        `Página ${productsPage} de ${productsLastPage}`;

    document.querySelector('#products-prev').disabled =
        productsPage <= 1;

    document.querySelector('#products-next').disabled =
        productsPage >= productsLastPage;
}

async function saveProduct(event) {
    event.preventDefault();

    await executeAction(async () => {
        const price = Number(
            document.querySelector('#product-price').value
        );

        const stock = Number(
            document.querySelector('#product-stock').value
        );

        const categoryId = Number(
            document.querySelector('#product-category').value
        );

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !Number.isSafeInteger(Math.round(price * 100)) ||
            !Number.isInteger(stock) ||
            stock < 0 ||
            !Number.isInteger(categoryId) ||
            categoryId < 1
        ) {
            throw new Error('Dados do produto inválidos.');
        }

        const data = {
            name: document.querySelector('#product-name').value.trim(),
            category_id: categoryId,
            description: document.querySelector('#product-description')
                .value.trim() || null,
            price_cents: Math.round(price * 100),
            stock_quantity: stock,
            image_path: document.querySelector('#product-image')
                .value.trim() || null,
            is_active: document.querySelector('#product-active').checked
        };

        const editing = editingProductId !== null;

        await apiRequest(
            editing
                ? `admin/products/${editingProductId}`
                : 'admin/products',
            {
                method: editing ? 'PUT' : 'POST',
                data
            }
        );

        resetProductForm();
        await loadProducts();
        setStatus('Produto salvo com sucesso.');
    });
}

async function deleteProduct(id) {
    if (!confirm('Deseja excluir este produto?')) return;

    await executeAction(async () => {
        await apiRequest(`admin/products/${id}`, {
            method: 'DELETE'
        });

        if (editingProductId === id) resetProductForm();

        await loadProducts();
        setStatus('Produto excluído com sucesso.');
    });
}

function formatAddress(address) {
    if (!address || typeof address !== 'object') {
        return 'Endereço indisponível';
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

function renderOrders(orders) {
    ordersBody.replaceChildren();

    if (orders.length === 0) {
        const row = document.createElement('tr');
        const cell = createElement('td', 'Nenhum pedido encontrado.');

        cell.colSpan = 5;
        row.appendChild(cell);
        ordersBody.appendChild(row);
        return;
    }

    for (const order of orders) {
        const row = document.createElement('tr');
        const id = createElement('td', `#${order.id}`);

        const customer = createElement(
            'td',
            order.user?.name ?? 'Cliente'
        );

        const status = createElement(
            'td',
            statusLabels[order.status] ?? order.status
        );

        const total = createElement(
            'td',
            money(order.total_cents)
        );

        const actions = document.createElement('td');

        const button = createButton(
            'Ver detalhes',
            'btn btn-outline-light btn-sm',
            () => showOrder(order.id)
        );

        actions.appendChild(button);
        row.append(id, customer, status, total, actions);
        ordersBody.appendChild(row);
    }
}

async function loadOrders() {
    const filter = document.querySelector('#orders-filter').value;
    const params = new URLSearchParams({
        page: String(ordersPage)
    });

    if (filter) params.set('status', filter);

    const response = await apiRequest(
        `admin/orders?${params.toString()}`
    );

    ordersLastPage = response.meta?.last_page ?? 1;

    if (ordersPage > ordersLastPage) {
        ordersPage = ordersLastPage;
        return loadOrders();
    }

    renderOrders(response.data ?? []);

    ordersCount.textContent =
        response.meta?.total ?? response.data?.length ?? 0;

    document.querySelector('#orders-page').textContent =
        `Página ${ordersPage} de ${ordersLastPage}`;

    document.querySelector('#orders-prev').disabled =
        ordersPage <= 1;

    document.querySelector('#orders-next').disabled =
        ordersPage >= ordersLastPage;
}

function renderOrderActions(order) {
    orderActions.replaceChildren();

    if (order.status === 'aguardando_pagamento') {
        orderActions.append(
            createButton(
                'Confirmar pagamento',
                'btn btn-success',
                () => changeOrder(order.id, 'pay')
            ),
            createButton(
                'Cancelar pedido',
                'btn btn-outline-danger',
                () => changeOrder(order.id, 'cancel')
            )
        );
    }

    if (order.status === 'pago') {
        orderActions.appendChild(
            createButton(
                'Marcar como enviado',
                'btn btn-danger',
                () => changeOrder(order.id, 'status', 'enviado')
            )
        );
    }

    if (order.status === 'enviado') {
        orderActions.appendChild(
            createButton(
                'Marcar como entregue',
                'btn btn-danger',
                () => changeOrder(order.id, 'status', 'entregue')
            )
        );
    }
}

function renderOrderDetails(order) {
    currentOrder = order;
    detailsContent.replaceChildren();

    addDetail(detailsContent, 'Pedido', `#${order.id}`);
    addDetail(
        detailsContent,
        'Status',
        statusLabels[order.status] ?? order.status
    );

    addDetail(
        detailsContent,
        'Cliente',
        order.user?.name ?? 'Não informado'
    );

    addDetail(
        detailsContent,
        'Endereço',
        formatAddress(order.address_snapshot)
    );

    const title = createElement('h3', 'Produtos', 'admin-detail-title');
    detailsContent.appendChild(title);

    for (const item of order.items ?? []) {
        addDetail(
            detailsContent,
            `${item.product_name} × ${item.quantity}`,
            money(item.subtotal_cents)
        );
    }

    addDetail(detailsContent, 'Subtotal', money(order.subtotal_cents));
    addDetail(detailsContent, 'Frete', money(order.shipping_cents));
    addDetail(detailsContent, 'Total', money(order.total_cents));

    renderOrderActions(order);
}

async function showOrder(id) {
    detailsSection.hidden = false;
    detailsContent.textContent = 'Carregando pedido...';

    try {
        const response = await apiRequest(
            `admin/orders/${encodeURIComponent(id)}`
        );

        renderOrderDetails(response.data);

        detailsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    } catch (error) {
        detailsContent.textContent =
            `Não foi possível consultar o pedido: ${error.message}`;

        orderActions.replaceChildren();
    }
}

async function changeOrder(id, action, status = null) {
    if (busy) return;

    if (
        action === 'cancel' &&
        !confirm('Deseja cancelar este pedido?')
    ) {
        return;
    }

    await executeAction(async () => {
        const path = action === 'status'
            ? `admin/orders/${id}/status`
            : `admin/orders/${id}/${action}`;

        await apiRequest(path, {
            method: action === 'status' ? 'PATCH' : 'POST',
            ...(status ? { data: { status } } : {})
        });

        await loadOrders();
        await showOrder(id);
        setStatus('Pedido atualizado com sucesso.');
    });
}

function bindEvents() {
    for (const tab of document.querySelectorAll('[data-tab]')) {
        tab.addEventListener('click', () => {
            changeTab(tab.dataset.tab);
        });
    }

    categoryForm.addEventListener('submit', saveCategory);
    productForm.addEventListener('submit', saveProduct);

    document.querySelector('#cancel-category-edit')
        .addEventListener('click', resetCategoryForm);

    document.querySelector('#cancel-product-edit')
        .addEventListener('click', resetProductForm);

    document.querySelector('#products-prev')
        .addEventListener('click', async () => {
            if (productsPage <= 1) return;

            productsPage--;

            try {
                await loadProducts();
            } catch (error) {
                productsPage++;
                setStatus(error.message, true);
            }
        });

    document.querySelector('#products-next')
        .addEventListener('click', async () => {
            if (productsPage >= productsLastPage) return;

            productsPage++;

            try {
                await loadProducts();
            } catch (error) {
                productsPage--;
                setStatus(error.message, true);
            }
        });

    document.querySelector('#orders-prev')
        .addEventListener('click', async () => {
            if (ordersPage <= 1) return;

            ordersPage--;

            try {
                await loadOrders();
            } catch (error) {
                ordersPage++;
                setStatus(error.message, true);
            }
        });

    document.querySelector('#orders-next')
        .addEventListener('click', async () => {
            if (ordersPage >= ordersLastPage) return;

            ordersPage++;

            try {
                await loadOrders();
            } catch (error) {
                ordersPage--;
                setStatus(error.message, true);
            }
        });

    document.querySelector('#orders-filter')
        .addEventListener('change', async () => {
            ordersPage = 1;
            detailsSection.hidden = true;

            try {
                await loadOrders();
            } catch (error) {
                setStatus(error.message, true);
            }
        });
}

async function initializeAdmin() {
    try {
        const response = await apiRequest('admin/check');

        if (!response.message) {
            throw new Error('Resposta de autorização inesperada.');
        }

        bindEvents();
        await loadCategories();
        await loadProducts();
        await loadOrders();

        dashboard.hidden = false;
        setStatus('Painel carregado com sucesso.');

    } catch (error) {
        dashboard.hidden = true;

        if (error.status === 401) {
            setStatus(
                'Faça login para acessar o painel administrativo.',
                true
            );
            return;
        }

        if (error.status === 403) {
            setStatus(
                'Acesso negado. Sua conta não possui permissão de administrador.',
                true
            );
            return;
        }

        setStatus(
            `Não foi possível carregar o painel: ${error.message}`,
            true
        );
    }
}

initializeAdmin();
