import '../../components/header.js';

import {
    createFavoriteButton,
    getFavoriteProducts
} from '../../components/favorites.js';

const favoriteList = document.querySelector('#favoriteList');
const favoriteMessage = document.querySelector('#favoriteMessage');

const money = cents => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(Number(cents ?? 0) / 100);

function createElement(tag, text = '', className = '') {
    const element = document.createElement(tag);

    element.textContent = text;
    element.className = className;

    return element;
}

function getImageUrl(path) {
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

function createProductImage(product) {
    const container = createElement(
        'div', '', 'product-image'
    );

    const imageUrl = getImageUrl(product.image_path);

    if (!imageUrl) {
        return container;
    }

    const image = document.createElement('img');

    image.src = imageUrl;
    image.alt = product.name;
    image.loading = 'lazy';
    image.className = 'w-100 h-100 object-fit-contain p-3';

    image.addEventListener('error', () => {
        container.replaceChildren();
    });

    container.appendChild(image);

    return container;
}


function createFavoriteCard(product) {
    const column = createElement(
        'div', '', 'col-sm-6 col-lg-4 col-xl-3'
    );

    column.dataset.favoriteProduct = String(product.id);

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
        'h2', '', 'product-name'
    );

    const productLink = createElement(
        'a',
        product.name,
        'stretched-link text-decoration-none text-white'
    );

    productLink.href = `/pages/product/product.html?id=${product.id}`;

    name.appendChild(productLink);

    const price = createElement(
        'p',
        money(product.price_cents),
        'product-price'
    );

    const stock = createElement(
        'p',
        product.stock_quantity > 0
            ? 'Disponível'
            : 'Sem estoque',
        'product-stock mb-0'
    );

    const favoriteButton = createFavoriteButton(product.id);

    const stockRow = createElement(
        'div',
        '',
        'd-flex align-items-center justify-content-between gap-2 mb-3'
    );

    stockRow.append(stock, favoriteButton);

    const viewProduct = createElement(
        'a',
        'Ver produto',
        'btn btn-danger w-100 position-relative z-2'
    );

    viewProduct.href = `/pages/product/product.html?id=${product.id}`;

    content.append(
        category,
        name,
        price,
        stockRow,
        viewProduct
    );

    card.append(image, content);
    column.appendChild(card);

    return column;
}

function updateMessage() {
    const count = favoriteList.childElementCount;

    if (count === 0) {
        favoriteMessage.className = 'alert alert-secondary';

        favoriteMessage.textContent =
            'Você ainda não adicionou produtos aos favoritos.';

        return;
    }

    favoriteMessage.className = 'text-secondary mb-3';

    favoriteMessage.textContent =
        `${count} produto(s) salvo(s) nos favoritos.`;
}

async function loadFavorites() {
    try {
        const products = await getFavoriteProducts();

        if (products === null) {
            return;
        }

        favoriteList.replaceChildren();

        for (const product of products) {
            favoriteList.appendChild(
                createFavoriteCard(product)
            );
        }

        updateMessage();

    } catch (error) {
        favoriteMessage.className = 'alert alert-danger';

        favoriteMessage.textContent =
            'Não foi possível carregar os favoritos.';
    }
}

document.addEventListener('favorites:changed', event => {
    if (event.detail.active) {
        return;
    }

    const productId = event.detail.productId;

    for (const column of favoriteList.children) {
        if (Number(column.dataset.favoriteProduct) === productId) {
            column.remove();
            break;
        }
    }

    updateMessage();
});

loadFavorites();
