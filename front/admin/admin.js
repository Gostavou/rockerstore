
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

const imageInput = document.querySelector('#product-image');
const imagePreview = document.querySelector('#product-image-preview');
const imagePreviewImg = document.querySelector('#product-image-preview-img');
const removeImageButton = document.querySelector('#remove-product-image');

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

let currentImagePath = null;
let removeCurrentImage = false;
let previewObjectUrl = null;

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

        if (!token) {
            throw new Error('Token CSRF indisponível.');
        }

        headers['X-XSRF-TOKEN'] = token;
    }

    if (
        options.data !== undefined &&
        !(options.data instanceof FormData)
    ) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/api/${path}`, {
        method,
        credentials: 'same-origin',
        headers,
        body: options.data instanceof FormData
            ? options.data
            : options.data !== undefined
                ? JSON.stringify(options.data)
                : undefined
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validation = Object.values(result.errors ?? {})
            .flat().join(' ');

        const error = new Error(
            validation ||
            result.message ||
            `Erro HTTP ${response.status}`
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

// ======================================================
// CATEGORIAS
// ======================================================

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
            'p',
            category.slug,
            'text-secondary small mb-0'
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

                categoryForm.scrollIntoView({
                    behavior: 'smooth'
                });
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
        const name = document.querySelector('#category-name')
            .value.trim();

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

        if (editingCategoryId === id) {
            resetCategoryForm();
        }

        await loadCategories();
        await loadProducts();

        setStatus('Categoria excluída com sucesso.');
    });
}

// ======================================================
// IMAGENS DOS PRODUTOS
// ======================================================

// Converte o caminho salvo no banco em uma URL.
function getProductImageUrl(path) {
    if (!path || typeof path !== 'string') {
        return null;
    }

    const value = path.trim();

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    if (value.startsWith('//')) {
        return null;
    }

    if (value.startsWith('/')) {
        return value;
    }

    return `/storage/${value.replace(/^storage\//, '')}`;
}

// Libera a URL temporária criada para a prévia.
function clearPreviewObjectUrl() {
    if (previewObjectUrl !== null) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }
}

// Exibe ou oculta a prévia.
function showImagePreview(url) {
    if (!url) {
        imagePreviewImg.removeAttribute('src');
        imagePreview.hidden = true;
        return;
    }

    imagePreviewImg.src = url;
    imagePreview.hidden = false;
}

// ======================================================
// PRODUTOS
// ======================================================

function resetProductForm() {
    editingProductId = null;

    currentImagePath = null;
    removeCurrentImage = false;

    clearPreviewObjectUrl();
    showImagePreview(null);

    productForm.reset();

    document.querySelector('#product-active').checked = true;

    document.querySelector('#product-form-title').textContent =
        'Cadastrar produto';

    document.querySelector('#cancel-product-edit').hidden = true;
}

function editProduct(product) {
    editingProductId = product.id;

    document.querySelector('#product-name').value =
        product.name;

    document.querySelector('#product-category').value =
        product.category?.id ?? '';

    document.querySelector('#product-description').value =
        product.description ?? '';

    document.querySelector('#product-price').value =
        (product.price_cents / 100).toFixed(2);

    document.querySelector('#product-stock').value =
        product.stock_quantity;

    // Limpa o seletor, mas mantém a imagem salva.
    imageInput.value = '';

    currentImagePath = product.image_path ?? null;
    removeCurrentImage = false;

    clearPreviewObjectUrl();

    // Exibe a imagem atual na prévia.
    showImagePreview(
        getProductImageUrl(currentImagePath)
    );

    document.querySelector('#product-active').checked =
        Boolean(product.is_active);

    document.querySelector('#product-form-title').textContent =
        'Editar produto';

    document.querySelector('#cancel-product-edit').hidden = false;

    productForm.scrollIntoView({
        behavior: 'smooth'
    });
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

        const name = createElement(
            'strong',
            product.name
        );

        const status = createElement(
            'span',
            product.is_active ? 'Ativo' : 'Inativo',
            `badge ms-2 ${
                product.is_active
                    ? 'text-bg-success'
                    : 'text-bg-secondary'
            }`
        );

        name.appendChild(status);

        const description = createElement(
            'p',
            `${product.category?.name ?? 'Sem categoria'} | ${money(product.price_cents)} | Estoque: ${product.stock_quantity}`,
            'text-secondary small mb-0'
        );

        info.append(name, description);

        const actions = createElement(
            'div',
            '',
            'd-flex gap-2'
        );

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

        // FormData permite enviar campos e arquivos.
        const data = new FormData();

        data.append(
            'name',
            document.querySelector('#product-name').value.trim()
        );

        data.append(
            'category_id',
            String(categoryId)
        );

        data.append(
            'description',
            document.querySelector('#product-description')
                .value.trim()
        );

        data.append(
            'price_cents',
            String(Math.round(price * 100))
        );

        data.append(
            'stock_quantity',
            String(stock)
        );

        data.append(
            'is_active',
            document.querySelector('#product-active').checked
                ? '1'
                : '0'
        );

        // Obtém o arquivo selecionado.
        const imageFile = imageInput.files[0];

        if (imageFile) {
            if (imageFile.size > 2 * 1024 * 1024) {
                throw new Error(
                    'A imagem deve ter no máximo 2 MB.'
                );
            }

            data.append('image', imageFile);
        }

        const editing = editingProductId !== null;

        if (editing) {
            // Laravel interpreta o POST como PUT.
            data.append('_method', 'PUT');

            // Informa ao backend que a imagem salva
            // deve ser removida quando clicar em Salvar.
            if (removeCurrentImage && !imageFile) {
                data.append('remove_image', '1');
            }
        }

        await apiRequest(
            editing
                ? `admin/products/${editingProductId}`
                : 'admin/products',
            {
                method: 'POST',
                data
            }
        );

        resetProductForm();

        await loadProducts();

        setStatus('Produto salvo com sucesso.');
    });
}

async function deleteProduct(id) {
    if (!confirm('Deseja excluir este produto?')) {
        return;
    }

    await executeAction(async () => {
        await apiRequest(
            `admin/products/${id}`,
            {
                method: 'DELETE'
            }
        );

        if (editingProductId === id) {
            resetProductForm();
        }

        await loadProducts();

        setStatus('Produto excluído com sucesso.');
    });
}

// ======================================================
// ENDEREÇO DO PEDIDO
// ======================================================

function formatAddress(address) {
    if (!address || typeof address !== 'object') {
        return 'Endereço indisponível';
    }

    return [
        address.recipient_name,
        [address.street, address.number]
            .filter(Boolean)
            .join(', '),
        address.complement,
        address.district,
        [address.city, address.state]
            .filter(Boolean)
            .join('/'),
        address.zip_code
    ].filter(Boolean).join(' — ');
}

// ======================================================
// PEDIDOS
// ======================================================

function renderOrders(orders) {
    ordersBody.replaceChildren();

    if (orders.length === 0) {
        const row = document.createElement('tr');

        const cell = createElement(
            'td',
            'Nenhum pedido encontrado.'
        );

        cell.colSpan = 5;

        row.appendChild(cell);
        ordersBody.appendChild(row);
        return;
    }

    for (const order of orders) {
        const row = document.createElement('tr');

        const id = createElement(
            'td',
            `#${order.id}`
        );

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

        row.append(
            id,
            customer,
            status,
            total,
            actions
        );

        ordersBody.appendChild(row);
    }
}

async function loadOrders() {
    const filter = document.querySelector('#orders-filter').value;

    const params = new URLSearchParams({
        page: String(ordersPage)
    });

    if (filter) {
        params.set('status', filter);
    }

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
        response.meta?.total ??
        response.data?.length ??
        0;

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
                () => changeOrder(
                    order.id,
                    'status',
                    'enviado'
                )
            )
        );
    }

    if (order.status === 'enviado') {
        orderActions.appendChild(
            createButton(
                'Marcar como entregue',
                'btn btn-danger',
                () => changeOrder(
                    order.id,
                    'status',
                    'entregue'
                )
            )
        );
    }
}

function renderOrderDetails(order) {
    currentOrder = order;

    detailsContent.replaceChildren();

    addDetail(
        detailsContent,
        'Pedido',
        `#${order.id}`
    );

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

    const title = createElement(
        'h3',
        'Produtos',
        'admin-detail-title'
    );

    detailsContent.appendChild(title);

    for (const item of order.items ?? []) {
        const categoryName =
            item.category_name ?? 'Sem categoria';

        addDetail(
            detailsContent,
            `${item.product_name} (${categoryName}) × ${item.quantity}`,
            money(item.subtotal_cents)
        );
    }

    addDetail(
        detailsContent,
        'Subtotal',
        money(order.subtotal_cents)
    );

    addDetail(
        detailsContent,
        'Frete',
        money(order.shipping_cents)
    );

    addDetail(
        detailsContent,
        'Total',
        money(order.total_cents)
    );

    renderOrderActions(order);
}

async function showOrder(id) {
    detailsSection.hidden = false;

    detailsContent.textContent =
        'Carregando pedido...';

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

// ======================================================
// EVENTOS
// ======================================================

function bindEvents() {
    // Navegação entre abas.
    for (const tab of document.querySelectorAll('[data-tab]')) {
        tab.addEventListener('click', () => {
            changeTab(tab.dataset.tab);
        });
    }

    categoryForm.addEventListener(
        'submit',
        saveCategory
    );

    productForm.addEventListener(
        'submit',
        saveProduct
    );

    document.querySelector('#cancel-category-edit')
        .addEventListener('click', resetCategoryForm);

    document.querySelector('#cancel-product-edit')
        .addEventListener('click', resetProductForm);

    // -----------------------------------------------
    // PRÉVIA DE IMAGENS
    // -----------------------------------------------

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];

        clearPreviewObjectUrl();

        // Sem novo arquivo: restaura a prévia existente,
        // exceto se a remoção já foi solicitada.
        if (!file) {
            showImagePreview(
                removeCurrentImage
                    ? null
                    : getProductImageUrl(currentImagePath)
            );
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        // Validação do formato.
        if (!allowedTypes.includes(file.type)) {
            imageInput.value = '';

            showImagePreview(
                removeCurrentImage
                    ? null
                    : getProductImageUrl(currentImagePath)
            );

            setStatus(
                'Selecione uma imagem JPG, PNG ou WebP.',
                true
            );

            return;
        }

        // Validação do tamanho.
        if (file.size > 2 * 1024 * 1024) {
            imageInput.value = '';

            showImagePreview(
                removeCurrentImage
                    ? null
                    : getProductImageUrl(currentImagePath)
            );

            setStatus(
                'A imagem deve ter no máximo 2 MB.',
                true
            );

            return;
        }

        // Selecionar outra imagem cancela a solicitação
        // de remoção da imagem anterior.
        removeCurrentImage = false;

        // Cria a URL temporária para mostrar a prévia.
        previewObjectUrl = URL.createObjectURL(file);

        showImagePreview(previewObjectUrl);
    });

    // -----------------------------------------------
    // REMOVER IMAGEM
    // -----------------------------------------------

    removeImageButton.addEventListener('click', () => {
        // Remove o arquivo escolhido do input.
        imageInput.value = '';

        // Limpa a prévia.
        clearPreviewObjectUrl();
        showImagePreview(null);

        // Se houver imagem salva no produto atual,
        // marca sua remoção para quando o formulário
        // for enviado ao Laravel.
        removeCurrentImage =
            editingProductId !== null &&
            currentImagePath !== null;
    });

    // -----------------------------------------------
    // PAGINAÇÃO DE PRODUTOS
    // -----------------------------------------------

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

    // -----------------------------------------------
    // PAGINAÇÃO DE PEDIDOS
    // -----------------------------------------------

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

    // -----------------------------------------------
    // FILTRO DE PEDIDOS
    // -----------------------------------------------

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

// ======================================================
// INICIALIZAÇÃO DO PAINEL
// ======================================================

async function initializeAdmin() {
    try {
        const response = await apiRequest('admin/check');

        if (!response.message) {
            throw new Error(
                'Resposta de autorização inesperada.'
            );
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
