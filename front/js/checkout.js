"use strict";

(() => {
    const $ = id => document.getElementById(id);

    const SHIPPING_CENTS = 1500;

    const money = cents => new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(cents / 100);

    function showMessage(text, type = "danger") {
        const element = $("checkoutMessage");

        element.className = "alert alert-" + type;
        element.textContent = text;
    }

    function getXsrfToken() {
        const cookie = document.cookie
            .split("; ")
            .find(item => item.startsWith("XSRF-TOKEN="));

        return cookie
            ? decodeURIComponent(cookie.split("=")[1])
            : null;
    }

    async function api(url, method = "GET", data = null) {
        const headers = {
            "Accept": "application/json"
        };

        if (method !== "GET") {
            const csrf = await fetch("/sanctum/csrf-cookie", {
                credentials: "same-origin",
                headers: { "Accept": "application/json" }
            });

            if (!csrf.ok) {
                throw new Error("Falha ao inicializar CSRF.");
            }

            const token = getXsrfToken();

            if (!token) {
                throw new Error("Token CSRF indisponível.");
            }

            headers["X-XSRF-TOKEN"] = token;
        }

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

        const result = await response.json()
            .catch(() => ({}));

        if (!response.ok) {
            const validation = Object.values(result.errors || {})
                .flat()
                .join(" ");

            const error = new Error(
                validation ||
                result.message ||
                "Erro na requisição."
            );

            error.status = response.status;

            throw error;
        }

        return result;
    }

    function makeElement(tag, text, className = "") {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    function renderSummary(cart) {
        const list = $("summaryItems");
        list.replaceChildren();

        for (const item of cart.items) {
            const name = item.product?.name || "Produto indisponível";

            const li = makeElement(
                "li",
                `${item.quantity}x ${name} — ${money(item.line_total_cents)}`,
                "mb-2"
            );

            list.appendChild(li);
        }

        $("subtotalText").textContent = money(
            cart.subtotal_cents
        );

        $("shippingText").textContent = money(
            SHIPPING_CENTS
        );

        $("totalText").textContent = money(
            cart.subtotal_cents + SHIPPING_CENTS
        );
    }

    function populateAddresses(addresses, selectedId = null) {
        const select = $("addressSelect");
        select.replaceChildren();

        const placeholder = new Option(
            "Selecione um endereço",
            ""
        );

        select.add(placeholder);

        for (const address of addresses) {
            const label = [
                address.recipient_name,
                address.street + ", " + address.number,
                address.city + "/" + address.state
            ].join(" — ");

            select.add(new Option(label, address.id));
        }

        if (selectedId !== null) {
            select.value = String(selectedId);
        } else if (addresses.length > 0) {
            select.value = String(addresses[0].id);
        }

        $("createOrderButton").disabled = !select.value;

        if (addresses.length === 0) {
            $("addressForm").classList.remove("d-none");
        }
    }

    async function loadAddresses(selectedId = null) {
        const result = await api("/api/addresses");

        populateAddresses(result.data, selectedId);
    }

    function renderOrder(order) {
        $("addressPanel").classList.add("d-none");
        $("summaryPanel").classList.add("d-none");
        $("emptyNotice").classList.add("d-none");

        $("orderPanel").classList.remove("d-none");

        $("orderId").textContent = order.id;

        const statuses = {
            aguardando_pagamento: "Aguardando pagamento",
            pago: "Pago",
            enviado: "Enviado",
            entregue: "Entregue",
            cancelado: "Cancelado"
        };

        $("orderStatus").textContent =
            statuses[order.status] || order.status;

        $("orderTotal").textContent = money(
            order.total_cents
        );

        const list = $("orderItems");
        list.replaceChildren();

        for (const item of order.items || []) {
            list.appendChild(
                makeElement(
                    "li",
                    `${item.quantity}x ${item.product_name} — ${money(item.subtotal_cents)}`,
                    "mb-2"
                )
            );
        }

        const canPay = order.status === "aguardando_pagamento";

        $("payButton").classList.toggle("d-none", !canPay);
        $("payButton").dataset.orderId = order.id;

        $("paymentMessage").textContent = canPay
            ? "O pedido foi criado. O pagamento ainda está pendente."
            : order.status === "pago"
                ? "Pagamento simulado confirmado."
                : "Status atual: " + $("orderStatus").textContent;
    }

    async function loadCheckout() {
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

        const orderId = new URLSearchParams(
            window.location.search
        ).get("order");

        if (orderId !== null) {
            if (!/^[1-9]\d*$/.test(orderId)) {
                showMessage("Número de pedido inválido.");
                return;
            }

            try {
                const result = await api(
                    "/api/orders/" + orderId
                );

                renderOrder(result.data);
            } catch (error) {
                showMessage(error.message);
            }

            return;
        }

        try {
            const [cartResult, addressResult] = await Promise.all([
                api("/api/cart"),
                api("/api/addresses")
            ]);

            const cart = cartResult.data;

            if (!cart.items || cart.items.length === 0) {
                $("emptyNotice").classList.remove("d-none");
                return;
            }

            renderSummary(cart);

            populateAddresses(addressResult.data);

            $("addressPanel").classList.remove("d-none");
            $("summaryPanel").classList.remove("d-none");
        } catch (error) {
            showMessage(error.message);
        }
    }

    $("newAddressButton").addEventListener("click", () => {
        $("addressForm").classList.toggle("d-none");
    });

    $("addressSelect").addEventListener("change", () => {
        $("createOrderButton").disabled =
            !$("addressSelect").value;
    });

    $("addressForm").addEventListener("submit", async event => {
        event.preventDefault();

        const button = $("saveAddressButton");
        button.disabled = true;

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        data.state = data.state.trim().toUpperCase();
        data.complement = data.complement.trim() || null;

        try {
            const result = await api(
                "/api/addresses",
                "POST",
                data
            );

            await loadAddresses(result.data.id);

            $("addressForm").reset();
            $("addressForm").classList.add("d-none");

            showMessage(
                "Endereço cadastrado com sucesso!",
                "success"
            );
        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
        }
    });

    $("orderForm").addEventListener("submit", async event => {
        event.preventDefault();

        const addressId = Number(
            $("addressSelect").value
        );

        if (!Number.isInteger(addressId) || addressId < 1) {
            showMessage("Selecione um endereço.");
            return;
        }

        const button = $("createOrderButton");
        button.disabled = true;

        try {
            const result = await api(
                "/api/orders",
                "POST",
                { address_id: addressId }
            );

            const order = result.data;

            window.history.replaceState(
                {},
                "",
                "/checkout.html?order=" + order.id
            );

            renderOrder(order);

            showMessage(
                "Pedido criado com sucesso!",
                "success"
            );
        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
        }
    });

    $("payButton").addEventListener("click", async () => {
        const button = $("payButton");
        const orderId = button.dataset.orderId;

        button.disabled = true;

        try {
            const result = await api(
                "/api/orders/" + orderId + "/pay",
                "POST"
            );

            renderOrder(result.data);

            showMessage(
                "Pagamento simulado realizado com sucesso!",
                "success"
            );
        } catch (error) {
            showMessage(error.message);
        } finally {
            button.disabled = false;
        }
    });

    loadCheckout();
})();
