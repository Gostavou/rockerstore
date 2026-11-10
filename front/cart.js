
"use strict";

(() => {


    const cartItems = document.getElementById("cartItems");

    const cartMessage = document.getElementById("cartMessage");

    const cartSubtotal = document.getElementById("cartSubtotal");

    const cartUnits = document.getElementById("cartUnits");

    const cartCount = document.getElementById("cartCount");

    let currentCart = null;
    let busy = false;



    function formatPrice(cents) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(cents / 100);
    }



    function showMessage(text, type = "danger") {
        cartMessage.className = "alert alert-" + type;
        cartMessage.textContent = text;
    }



    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        element.className = className;

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }


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


    async function cartRequest(url, method, data = null) {

        const csrfResponse = await fetch(
            "/sanctum/csrf-cookie",
            {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!csrfResponse.ok) {
            throw new Error("Não foi possível obter o CSRF.");
        }

        const token = getXsrfToken();

        if (!token) {
            throw new Error("Token CSRF não encontrado.");
        }

        const headers = {
            "Accept": "application/json",
            "X-XSRF-TOKEN": token
        };

        if (data !== null) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            method,
            credentials: "same-origin",
            headers,
            body: data !== null
                ? JSON.stringify(data)
                : undefined
        });

        const result = await response.json();

        if (!response.ok) {
            const errors = Object.values(result.errors || {})
                .flat()
                .join(" ");

            throw new Error(
                errors ||
                result.message ||
                "Não foi possível atualizar o carrinho."
            );
        }

        return result;
    }

    async function changeCart(url, method, data, successMessage) {

        if (busy) {
            return;
        }

        busy = true;

        cartItems.querySelectorAll("button").forEach(button => {
            button.disabled = true;
        });

        try {
            const result = await cartRequest(
                url,
                method,
                data
            );

            currentCart = result.data;

            renderCart(currentCart);

            showMessage(successMessage, "success");

        } catch (error) {

            if (currentCart) {
                renderCart(currentCart);
            }

            showMessage(error.message);

        } finally {
            busy = false;
        }
    }


    async function updateQuantity(itemId, quantity, stock) {

        if (!Number.isInteger(quantity) || quantity < 1) {
            showMessage("Informe uma quantidade válida.");
            return;
        }

        if (quantity > stock) {
            showMessage(
                "A quantidade supera o estoque disponível."
            );

            return;
        }

        await changeCart(
            "/api/cart/items/" + itemId,
            "PUT",
            { quantity },
            "Quantidade atualizada com sucesso!"
        );
    }

    async function removeItem(itemId) {

        const confirmed = window.confirm(
            "Deseja remover este produto do carrinho?"
        );

        if (!confirmed) {
            return;
        }

        await changeCart(
            "/api/cart/items/" + itemId,
            "DELETE",
            null,
            "Produto removido do carrinho!"
        );
    }

    function createCartItem(item) {

        const product = item.product;

        const name = product?.name || "Produto indisponível";

        const price = product?.price_cents ?? 0;

        const stock = product?.stock_quantity ?? 0;

        const available = Boolean(
            product && product.is_active && stock > 0
        );

        const card = createElement(
            "article",
            "cart-item mb-3"
        );

        const row = createElement(
            "div",
            "row g-3 align-items-center"
        );

        const imageColumn = createElement(
            "div",
            "col-sm-3"
        );

        const image = createElement(
            "div",
            "cart-image",
            "🎸"
        );

        image.setAttribute("aria-hidden", "true");

        imageColumn.appendChild(image);

        const infoColumn = createElement(
            "div",
            "col-sm-6"
        );

        const title = createElement(
            "h2",
            "h5 fw-bold",
            name
        );

        const unitPrice = createElement(
            "p",
            "text-secondary mb-2",
            "Preço unitário: " + formatPrice(price)
        );

        const stockInfo = createElement(
            "p",
            "small text-secondary mb-2",
            available
                ? "Estoque disponível: " + stock
                : "Produto indisponível"
        );

        const quantityLabel = createElement(
            "label",
            "form-label small",
            "Quantidade"
        );

        const quantityInput = createElement(
            "input",
            "form-control cart-quantity"
        );

        quantityInput.type = "number";
        quantityInput.min = "1";
        quantityInput.step = "1";
        quantityInput.value = String(item.quantity);
        quantityInput.disabled = !available;

        quantityInput.id = "quantity-" + item.id;

        quantityLabel.htmlFor = quantityInput.id;

        const saveButton = createElement(
            "button",
            "btn btn-outline-light btn-sm",
            "Atualizar"
        );

        saveButton.type = "button";
        saveButton.disabled = !available;

        saveButton.addEventListener("click", () => {

            const quantity = Number(quantityInput.value);

            updateQuantity(item.id, quantity, stock);
        });

        const quantityControls = createElement(
            "div",
            "d-flex align-items-end gap-2 flex-wrap"
        );

        const quantityGroup = createElement(
            "div",
            ""
        );

        quantityGroup.append(
            quantityLabel,
            quantityInput
        );

        quantityControls.append(
            quantityGroup,
            saveButton
        );

        infoColumn.append(
            title,
            unitPrice,
            stockInfo,
            quantityControls
        );


        const actionColumn = createElement(
            "div",
            "col-sm-3 text-sm-end"
        );

        const lineTotal = createElement(
            "p",
            "cart-item-total",
            formatPrice(item.line_total_cents)
        );

        const removeButton = createElement(
            "button",
            "btn btn-outline-danger btn-sm",
            "Remover"
        );

        removeButton.type = "button";

        removeButton.addEventListener("click", () => {
            removeItem(item.id);
        });

        actionColumn.append(
            lineTotal,
            removeButton
        );

        row.append(
            imageColumn,
            infoColumn,
            actionColumn
        );

        card.appendChild(row);

        return card;
    }


    function renderCart(cart) {

        cartItems.replaceChildren();

        const items = cart.items || [];


        const checkoutLink = document.getElementById("checkoutLink");

        checkoutLink.classList.toggle(
            "disabled",
            items.length === 0
        );

        checkoutLink.setAttribute(
            "aria-disabled",
            String(items.length === 0)
        );

        checkoutLink.tabIndex = items.length === 0 ? -1 : 0;


        const totalQuantity = items.reduce(
            (total, item) => total + item.quantity,
            0
        );

        cartCount.textContent = totalQuantity;
        cartUnits.textContent = totalQuantity;

        cartSubtotal.textContent = formatPrice(
            cart.subtotal_cents
        );

        if (items.length === 0) {

            const empty = createElement(
                "div",
                "cart-empty text-center",
                "Seu carrinho está vazio."
            );

            const link = createElement(
                "a",
                "btn btn-danger mt-3",
                "Explorar produtos"
            );

            link.href = "/#catalogo";

            empty.appendChild(
                document.createElement("br")
            );

            empty.appendChild(link);

            cartItems.appendChild(empty);

            return;
        }

        for (const item of items) {
            cartItems.appendChild(
                createCartItem(item)
            );
        }
    }



    async function loadCart() {

        try {
            const response = await fetch("/api/cart", {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    "Não foi possível consultar o carrinho."
                );
            }

            const result = await response.json();

            currentCart = result.data;

            renderCart(currentCart);

        } catch (error) {
            showMessage(error.message);
        }
    }



    loadCart();

})();
