import './header.js';
const productPanel = document.querySelector('#productPanel');
const productMessage = document.querySelector('#productMessage');
const productLoading = document.querySelector('#productLoading');
const productVisual = document.querySelector('#productVisual');
const productCategory = document.querySelector('#productCategory');
const productName = document.querySelector('#productName');
const productPrice = document.querySelector('#productPrice');
const productStock = document.querySelector('#productStock');
const productDescription = document.querySelector('#productDescription');
const productQuantity = document.querySelector('#productQuantity');
const addCartForm = document.querySelector('#addCartForm');
const addToCartButton = document.querySelector('#addToCartButton');
const viewCartLink = document.querySelector('#viewCartLink');
const cartCount = document.querySelector('#cartCount');

let currentProduct = null;
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
    productMessage.className = `alert alert-${type} mb-4`;
    productMessage.textContent = text;
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

function updateCartCount(cart) {
    const quantity = (cart.items ?? []).reduce(
        (total, item) => total + item.quantity,
        0
    );

    cartCount.textContent = quantity;
}

function renderProductImage(product) {
    productVisual.replaceChildren();

    const fallback = () => {
        productVisual.replaceChildren(
            createElement('span', '🎸', 'display-1')
        );
    };

    const path = product.image_path?.trim();

    if (!path) {
        fallback();
        return;
    }

    const image = document.createElement('img');

    image.src = /^https?:\/\//i.test(path)
        ? path
        : path.startsWith('/')
            ? path
            : `/storage/${path.replace(/^storage\//, '')}`;

    image.alt = product.name;
    image.className = 'w-100 h-100 object-fit-contain p-3';
    image.loading = 'lazy';

    image.addEventListener('error', fallback);
    productVisual.appendChild(image);
}

function renderProduct(product) {
    currentProduct = product;

    document.title = `${product.name} | RockerStore`;

    productCategory.textContent =
        product.category?.name ?? 'Instrumentos musicais';

    productName.textContent = product.name;
    productPrice.textContent = money(product.price_cents);

    productDescription.textContent =
        product.description || 'Descrição não informada.';

    renderProductImage(product);

    const stock = Number(product.stock_quantity);
    const available = product.is_active && stock > 0;

    productStock.textContent = available
        ? `Em estoque: ${stock} unidade(s)`
        : 'Produto indisponível';

    productStock.className = available
        ? 'text-success mb-4'
        : 'text-danger mb-4';

    productQuantity.value = '1';
    productQuantity.max = String(stock);
    productQuantity.disabled = !available;
    addToCartButton.disabled = !available;

    viewCartLink.classList.add('d-none');
    productPanel.classList.remove('d-none');
}

async function loadProduct() {
    const id = new URLSearchParams(
        window.location.search
    ).get('id');

    if (!id || !/^[1-9]\d*$/.test(id) ||
        !Number.isSafeInteger(Number(id))) {
        productLoading.classList.add('d-none');
        setMessage('Identificador de produto inválido.');
        return;
    }

    try {
        const response = await apiRequest(`products/${id}`);
        renderProduct(response.data);

    } catch (error) {
        setMessage(
            error.status === 404
                ? 'Produto não encontrado ou indisponível.'
                : error.message
        );

    } finally {
        productLoading.classList.add('d-none');
    }
}

async function loadCartCount() {
    try {
        const response = await apiRequest('cart');
        updateCartCount(response.data);

    } catch (error) {
        console.error('Erro ao consultar carrinho:', error);
    }
}

async function addToCart(event) {
    event.preventDefault();

    if (!currentProduct || busy) return;

    const quantity = Number(productQuantity.value);
    const stock = Number(currentProduct.stock_quantity);

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > stock
    ) {
        setMessage('Informe uma quantidade válida dentro do estoque.');
        return;
    }

    busy = true;
    addToCartButton.disabled = true;

    try {
        const response = await apiRequest('cart/items', {
            method: 'POST',
            data: {
                product_id: currentProduct.id,
                quantity
            }
        });

        updateCartCount(response.data);
        viewCartLink.classList.remove('d-none');

        setMessage(
            'Produto adicionado ao carrinho com sucesso!',
            'success'
        );

    } catch (error) {
        setMessage(error.message);

    } finally {
        busy = false;
        addToCartButton.disabled = false;
    }
}

function initializeProduct() {
    addCartForm.addEventListener('submit', addToCart);
    loadProduct();
    loadCartCount();
}

initializeProduct();
