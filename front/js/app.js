
"use strict";

// ELEMENTOS DA INTERFACE

const productList = document.getElementById("productList");
const message = document.getElementById("message");
const categorySelect = document.getElementById("category");

const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const cartCount = document.getElementById("cartCount");

let currentPage = 1;
let lastPage = 1;

// FORMATAÇÃO DE PREÇOS

function formatPrice(cents) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(cents / 100);
}

// REQUISIÇÕES GET

async function getJson(url) {
    const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("HTTP " + response.status);
    }

    return response.json();
}

// MENSAGENS

function showMessage(text, type = "secondary") {
    message.className = "alert alert-" + type;
    message.textContent = text;
}

// CARREGAR CATEGORIAS

async function loadCategories() {
    try {
        const result = await getJson("/api/categories");

        for (const category of result.data) {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

// CRIAR ELEMENTOS

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    element.className = className;

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// CRIAR CARD DE PRODUTO

function createProductCard(product) {
    const column = createElement(
        "div",
        "col-sm-6 col-lg-4 col-xl-3"
    );

    const card = createElement("article", "product-card");

    const image = createElement(
        "div",
        "product-image",
        "🎸"
    );

    image.setAttribute("aria-hidden", "true");

    const content = createElement(
        "div",
        "product-content"
    );

    const category = createElement(
        "p",
        "product-category",
        product.category.name
    );

    const name = createElement(
        "h3",
        "product-name",
        product.name
    );

    const price = createElement(
        "p",
        "product-price",
        formatPrice(product.price_cents)
    );

    const inStock = product.stock_quantity > 0;

    const stock = createElement(
        "p",
        "product-stock",
        inStock ? "Disponível" : "Sem estoque"
    );

    const button = createElement(
        "button",
        "btn btn-danger w-100",
        "Adicionar ao carrinho"
    );

    button.type = "button";
    button.disabled = !inStock;

    button.addEventListener("click", async () => {
        button.disabled = true;

        try {
            await addToCart(product.id);
        } finally {
            button.disabled = !inStock;
        }
    });

    content.append(
        category,
        name,
        price,
        stock,
        button
    );

    card.append(image, content);
    column.appendChild(card);

    return column;
}

// CARREGAR PRODUTOS

async function loadProducts() {
    productList.replaceChildren();
    showMessage("Carregando produtos...");

    const search = document.getElementById("search")
        .value.trim();

    const categoryId = categorySelect.value;

    const params = new URLSearchParams();

    params.set("page", currentPage);

    if (search) {
        params.set("search", search);
    }

    if (categoryId) {
        params.set("category_id", categoryId);
    }

    try {
        const result = await getJson(
            "/api/products?" + params.toString()
        );

        const products = result.data || [];

        lastPage = result.meta?.last_page || 1;

        for (const product of products) {
            productList.appendChild(
                createProductCard(product)
            );
        }

        if (products.length === 0) {
            showMessage("Nenhum produto encontrado.");
        } else {
            message.className = "text-secondary mb-3";
            message.textContent =
                result.meta.total + " produtos encontrados.";
        }

        pageInfo.textContent =
            "Página " + currentPage + " de " + lastPage;

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= lastPage;

    } catch (error) {
        console.error(error);

        showMessage(
            "Não foi possível carregar os produtos.",
            "danger"
        );
    }
}

// COOKIE CSRF

function getXsrfToken() {
    const cookie = document.cookie
        .split("; ")
        .find(item => item.startsWith("XSRF-TOKEN="));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(
        cookie.substring("XSRF-TOKEN=".length)
    );
}

// ADICIONAR AO CARRINHO

async function addToCart(productId) {
    try {
        // Inicializa a proteção CSRF do Laravel.
        const csrfResponse = await fetch(
            "/sanctum/csrf-cookie",
            {
                credentials: "same-origin"
            }
        );

        if (!csrfResponse.ok) {
            throw new Error("Falha ao obter CSRF.");
        }

        const token = getXsrfToken();

        if (!token) {
            throw new Error("Token CSRF não encontrado.");
        }

        // Envia o produto para o backend.
        const response = await fetch("/api/cart/items", {
            method: "POST",

            credentials: "same-origin",

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": token
            },

            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Erro ao adicionar produto."
            );
        }

        updateCartCount(result.data);

        showMessage(
            "Produto adicionado ao carrinho!",
            "success"
        );

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

// CONTADOR DE ITENS

function updateCartCount(cart) {
    const total = (cart.items || []).reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cartCount.textContent = total;
}

async function loadCart() {
    try {
        const result = await getJson("/api/cart");

        updateCartCount(result.data);
    } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
    }
}

// EVENTOS

document.getElementById("filtroForm")
    .addEventListener("submit", event => {
        event.preventDefault();

        currentPage = 1;
        loadProducts();
    });

prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadProducts();
    }
});

nextButton.addEventListener("click", () => {
    if (currentPage < lastPage) {
        currentPage++;
        loadProducts();
    }
});

// INICIALIZAÇÃO

loadCategories();
loadProducts();
loadCart();
