import './header.js';

const productList = document.querySelector('#productList');
const message = document.querySelector('#message');
const categorySelect = document.querySelector('#category');
const sortSelect = document.querySelector('#sort');
const searchInput = document.querySelector('#search');
const filterForm = document.querySelector('#filtroForm');
const prevButton = document.querySelector('#prevPage');
const nextButton = document.querySelector('#nextPage');
const pageInfo = document.querySelector('#pageInfo');
const cartCount = document.querySelector('#cartCount');

let currentPage = 1;
let lastPage = 1;

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

function setMessage(text, type = 'secondary') {
    message.className = `alert alert-${type}`;
    message.textContent = text;
}

function getImageUrl(path) {
    if (!path || typeof path !== 'string') return null;

    const value = path.trim();

    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('//')) return null;
    if (value.startsWith('/')) return value;

    return `/storage/${value.replace(/^storage\//, '')}`;
}

function createProductImage(product) {
    const container = createElement(
        'div', '', 'product-image'
    );

    const fallback = () => {
        container.replaceChildren(
            createElement('span', '')
        );
    };

    const url = getImageUrl(product.image_path);

    if (!url) {
        fallback();
        return container;
    }

    const image = document.createElement('img');
    image.src = url;
    image.alt = product.name;
    image.className = 'w-100 h-100 object-fit-contain p-3';
    image.loading = 'lazy';

    image.addEventListener('error', fallback);
    container.appendChild(image);

    return container;
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

        throw new Error(
            validation || result.message || `Erro HTTP ${response.status}`
        );
    }

    return result;
}

async function loadCategories() {
    try {
        const response = await apiRequest('categories');

        categorySelect.replaceChildren(
            new Option('Todas as categorias', '')
        );

        for (const category of response.data ?? []) {
            categorySelect.add(
                new Option(category.name, category.id)
            );
        }

    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setMessage('Não foi possível carregar as categorias.', 'danger');
    }
}

function createProductCard(product) {
    const column = createElement(
        'div', '', 'col-sm-6 col-lg-4 col-xl-3'
    );

    const card = createElement(
        'article', '', 'product-card position-relative'
    );

    const image = createProductImage(product);
    const content = createElement(
        'div', '', 'product-content'
    );

    const category = createElement(
        'p',
        product.category?.name ?? 'Instrumentos',
        'product-category'
    );

    const name = createElement(
        'h3', '', 'product-name'
    );

    const productLink = createElement(
        'a',
        product.name,
        'stretched-link text-decoration-none text-white'
    );

    productLink.href = `/product.html?id=${product.id}`;
    name.appendChild(productLink);

    const price = createElement(
        'p',
        money(product.price_cents),
        'product-price'
    );

    const inStock = product.stock_quantity > 0;

    const stock = createElement(
        'p',
        inStock ? 'Disponível' : 'Sem estoque',
        'product-stock'
    );

    const button = createElement(
        'button',
        'Adicionar ao carrinho',
        'btn btn-danger w-100 position-relative z-2'
    );

    button.type = 'button';
    button.disabled = !inStock;

    button.addEventListener('click', async () => {
        button.disabled = true;

        try {
            await addToCart(product.id);
        } finally {
            button.disabled = !inStock;
        }
    });

    content.append(category, name, price, stock, button);
    card.append(image, content);
    column.appendChild(card);

    return column;
}

async function loadProducts() {
    productList.replaceChildren();
    setMessage('Carregando produtos...');

    const params = new URLSearchParams({
        page: String(currentPage)
    });

    const search = searchInput.value.trim();
    const categoryId = categorySelect.value;
    const sort = sortSelect.value;

    if (search) {
        params.set('search', search);
    }

    if (categoryId) {
        params.set('category_id', categoryId);
    }

    params.set('sort', sort);

    try {
        const response = await apiRequest(`products?${params}`);
        const products = response.data ?? [];

        lastPage = response.meta?.last_page ?? 1;

        for (const product of products) {
            productList.appendChild(
                createProductCard(product)
            );
        }

        if (products.length === 0) {
            setMessage('Nenhum produto encontrado.');
        } else {
            message.className = 'text-secondary mb-3';
            message.textContent =
                `${response.meta?.total ?? products.length} produtos encontrados.`;
        }

        pageInfo.textContent =
            `Página ${currentPage} de ${lastPage}`;

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= lastPage;

    } catch (error) {
        console.error(error);
        setMessage('Não foi possível carregar os produtos.', 'danger');
        prevButton.disabled = true;
        nextButton.disabled = true;
    }
}

function updateCartCount(cart) {
    const total = (cart.items ?? []).reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cartCount.textContent = total;
}

async function addToCart(productId) {
    try {
        const response = await apiRequest('cart/items', {
            method: 'POST',
            data: {
                product_id: productId,
                quantity: 1
            }
        });

        updateCartCount(response.data);
        setMessage('Produto adicionado ao carrinho!', 'success');

    } catch (error) {
        setMessage(error.message, 'danger');
    }
}

async function loadCart() {
    try {
        const response = await apiRequest('cart');
        updateCartCount(response.data);

    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

function bindEvents() {
    filterForm.addEventListener('submit', event => {
        event.preventDefault();
        currentPage = 1;
        loadProducts();
    });

    prevButton.addEventListener('click', () => {
        if (currentPage <= 1) return;

        currentPage--;
        loadProducts();
    });

    nextButton.addEventListener('click', () => {
        if (currentPage >= lastPage) return;

        currentPage++;
        loadProducts();
    });

    sortSelect.addEventListener('change', () => {
    currentPage = 1;
    loadProducts();
    });
}

function initializeApp() {
    bindEvents();
    loadCategories();
    loadProducts();
    loadCart();
}

initializeApp();
