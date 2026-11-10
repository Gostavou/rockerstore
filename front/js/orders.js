"use strict";

(() => {

    const $ = id => document.getElementById(id);

    const statusLabels = {
        aguardando_pagamento: "Aguardando pagamento",
        pago: "Pago",
        enviado: "Enviado",
        entregue: "Entregue",
        cancelado: "Cancelado"
    };

    let currentPage = 1;
    let lastPage = 1;
    let currentOrder = null;
    let busy = false;

    function money(cents) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(cents / 100);
    }

    function formatDate(date) {
        return date
            ? new Date(date).toLocaleString("pt-BR")
            : "Data indisponível";
    }

    function createElement(tag, text, className = "") {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    function showMessage(text, type = "danger") {
        $("ordersMessage").className =
            "alert alert-" + type + " mb-4";

        $("ordersMessage").textContent = text;
    }

    function getXsrfToken() {
        const cookie = document.cookie
            .split("; ")
            .find(item => item.startsWith("XSRF-TOKEN="));

        return cookie
            ? decodeURIComponent(
                cookie.substring("XSRF-TOKEN=".length)
            )
            : null;
    }

    async function api(url, method = "GET") {
        const headers = {
            "Accept": "application/json"
        };

        if (method !== "GET") {
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
                throw new Error("Falha ao obter CSRF.");
            }

            const token = getXsrfToken();

            if (!token) {
                throw new Error("Token CSRF não encontrado.");
            }

            headers["X-XSRF-TOKEN"] = token;
        }

        const response = await fetch(url, {
            method,
            credentials: "same-origin",
            headers
        });

        const result = await response.json()
            .catch(() => ({}));

        if (!response.ok) {
            const error = new Error(
                result.message || "Erro na requisição."
            );

            error.status = response.status;
            throw error;
        }

        return result;
    }

    function statusBadge(status) {
        const classes = {
            aguardando_pagamento: "text-bg-warning",
            pago: "text-bg-success",
            enviado: "text-bg-info",
            entregue: "text-bg-success",
            cancelado: "text-bg-secondary"
        };

        return createElement(
            "span",
            statusLabels[status] || status,
            "badge " + (classes[status] || "text-bg-secondary")
        );
    }

    function renderOrders(orders) {
        const list = $("ordersList");
        list.replaceChildren();

        if (orders.length === 0) {
            list.appendChild(
                createElement(
                    "div",
                    "Você ainda não possui pedidos.",
                    "cart-empty text-center"
                )
            );

            return;
        }

        for (const order of orders) {
            const card = createElement(
                "article",
                "",
                "order-card mb-3"
            );

            const content = createElement(
                "div",
                "",
                "d-flex justify-content-between " +
                "align-items-center flex-wrap gap-3"
            );

            const info = createElement("div", "");

            info.append(
                createElement(
                    "h2",
                    "Pedido #" + order.id,
                    "h5 fw-bold"
                ),

                createElement(
                    "p",
                    formatDate(order.created_at),
                    "text-secondary small mb-2"
                ),

                statusBadge(order.status)
            );

            const actions = createElement(
                "div",
                "",
                "text-md-end"
            );

            actions.append(
                createElement(
                    "p",
                    money(order.total_cents),
                    "cart-item-total mb-2"
                )
            );

            const button = createElement(
                "button",
                "Ver detalhes",
                "btn btn-outline-light btn-sm"
            );

            button.type = "button";

            button.addEventListener("click", () => {
                loadOrderDetails(order.id);
            });

            actions.appendChild(button);

            content.append(info, actions);
            card.appendChild(content);
            list.appendChild(card);
        }
    }

    async function loadOrders() {
        const result = await api(
            "/api/orders?page=" + currentPage
        );

        renderOrders(result.data || []);

        lastPage = result.meta?.last_page || 1;

        $("pageInfo").textContent =
            "Página " + currentPage + " de " + lastPage;

        $("prevPage").disabled = currentPage <= 1;
        $("nextPage").disabled = currentPage >= lastPage;
    }

    function formatAddress(address) {
        if (!address || typeof address !== "object") {
            return "Endereço indisponível.";
        }

        return [
            address.recipient_name,
            [address.street, address.number]
                .filter(Boolean)
                .join(", "),
            address.complement,
            address.district,
            [address.city, address.state]
                .filter(Boolean)
                .join("/"),
            address.zip_code
        ].filter(Boolean).join(" — ");
    }

    function renderDetails(order) {
        currentOrder = order;

        $("detailsPanel").classList.remove("d-none");

        $("detailsTitle").textContent =
            "Pedido #" + order.id;

        const status = $("detailsStatus");
        const badge = statusBadge(order.status);

        status.className = badge.className;
        status.textContent = badge.textContent;

        $("detailsDate").textContent =
            "Criado em: " + formatDate(order.created_at);

        $("detailsAddress").textContent =
            formatAddress(order.address_snapshot);

        $("detailsSubtotal").textContent =
            money(order.subtotal_cents);

        $("detailsShipping").textContent =
            money(order.shipping_cents);

        $("detailsTotal").textContent =
            money(order.total_cents);

        const itemsList = $("detailsItems");
        itemsList.replaceChildren();

        for (const item of order.items || []) {
            itemsList.appendChild(
                createElement(
                    "li",
                    item.quantity + "x " +
                    item.product_name + " — " +
                    money(item.subtotal_cents),
                    "order-detail-item"
                )
            );
        }

        const pending =
            order.status === "aguardando_pagamento";

        $("payOrderButton").classList.toggle(
            "d-none",
            !pending
        );

        $("cancelOrderButton").classList.toggle(
            "d-none",
            !pending
        );

        $("detailsPanel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function loadOrderDetails(orderId) {
        try {
            const result = await api(
                "/api/orders/" + orderId
            );

            renderDetails(result.data);

        } catch (error) {
            showMessage(error.message);
        }
    }

    async function changeOrder(action) {
        if (
            busy ||
            !currentOrder ||
            currentOrder.status !== "aguardando_pagamento"
        ) {
            return;
        }

        if (
            action === "cancel" &&
            !window.confirm("Deseja cancelar este pedido?")
        ) {
            return;
        }

        busy = true;

        $("payOrderButton").disabled = true;
        $("cancelOrderButton").disabled = true;

        try {
            const result = await api(
                "/api/orders/" + currentOrder.id + "/" + action,
                "POST"
            );

            renderDetails(result.data);

            showMessage(
                action === "pay"
                    ? "Pagamento simulado confirmado!"
                    : "Pedido cancelado com sucesso!",
                "success"
            );

            await loadOrders();

        } catch (error) {
            showMessage(error.message);

        } finally {
            busy = false;

            $("payOrderButton").disabled = false;
            $("cancelOrderButton").disabled = false;
        }
    }

    async function changePage(direction) {
        const previousPage = currentPage;

        currentPage += direction;

        try {
            await loadOrders();
        } catch (error) {
            currentPage = previousPage;
            showMessage(error.message);
        }
    }

    async function initialize() {
        try {
            await api("/api/user");

        } catch (error) {
            if (error.status === 401) {
                $("loginNotice").classList.remove("d-none");
            } else {
                showMessage(error.message);
            }

            return;
        }

        $("ordersPanel").classList.remove("d-none");

        try {
            await loadOrders();

        } catch (error) {
            showMessage(error.message);
        }
    }

    $("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            changePage(-1);
        }
    });

    $("nextPage").addEventListener("click", () => {
        if (currentPage < lastPage) {
            changePage(1);
        }
    });

    $("payOrderButton").addEventListener("click", () => {
        changeOrder("pay");
    });

    $("cancelOrderButton").addEventListener("click", () => {
        changeOrder("cancel");
    });

    initialize();

})();
