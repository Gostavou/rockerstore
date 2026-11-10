
"use strict";

(() => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authMessage = document.getElementById("authMessage");

    function showAuthMessage(text, type = "danger") {
        if (!authMessage) {
            return;
        }

        authMessage.className = "alert alert-" + type;
        authMessage.textContent = text;
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

    async function sendRequest(url, method, data = null) {

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
            throw new Error(
                "Não foi possível inicializar a sessão."
            );
        }

        const token = getXsrfToken();

        if (!token) {
            throw new Error(
                "Token CSRF não encontrado."
            );
        }

        const headers = {
            "Accept": "application/json",
            "X-XSRF-TOKEN": token
        };

        if (data !== null) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            method: method,
            credentials: "same-origin",
            headers: headers,
            body: data !== null
                ? JSON.stringify(data)
                : undefined
        });

        let result = {};

        try {
            result = await response.json();
        } catch {
        }

        if (!response.ok) {
            const errors = Object.values(result.errors || {})
                .flat()
                .join(" ");

            throw new Error(
                errors ||
                result.message ||
                "Não foi possível concluir a operação."
            );
        }

        return result;
    }

    async function handleAuth(event, type) {

        event.preventDefault();

        const form = event.currentTarget;
        const submitButton = document.getElementById("authSubmit");

        const formData = new FormData(form);

        const data = {
            email: formData.get("email"),
            password: formData.get("password")
        };

        if (type === "register") {
            data.name = formData.get("name");

            data.password_confirmation =
                formData.get("password_confirmation");

            if (data.password !== data.password_confirmation) {
                showAuthMessage(
                    "As senhas informadas não coincidem."
                );

                return;
            }
        }

        const url = type === "login"
            ? "/api/auth/login"
            : "/api/auth/register";

        const next = new URLSearchParams(
            window.location.search
        ).get("next");

        const allowedDestinations = [
            "/checkout.html",
            "/orders.html"
        ];

        const destination = allowedDestinations.includes(next)
            ? next
            : "/";

        submitButton.disabled = true;
        submitButton.textContent = "Processando...";

        try {
            const result = await sendRequest(
                url,
                "POST",
                data
            );

            const warnings =
                result.data?.cart_merge?.warnings || [];

            if (warnings.length > 0) {
                const aviso = warnings
                    .map(item => item.message)
                    .join(" ");

                showAuthMessage(
                    "Conta autenticada! Atenção ao carrinho: " +
                    aviso,
                    "warning"
                );

                const link = document.createElement("a");

                link.href = destination;
                link.className = "btn btn-danger mt-2";
                link.textContent = destination === "/checkout.html"
                    ? "Continuar para o checkout"
                    : "Continuar para a loja";

                authMessage.appendChild(link);

                form.classList.add("d-none");

                return;
            }

            showAuthMessage(
                "Autenticação realizada com sucesso!",
                "success"
            );

            window.location.assign(destination);

        } catch (error) {
            showAuthMessage(error.message);
        } finally {
            submitButton.disabled = false;

            submitButton.textContent = type === "login"
                ? "Entrar"
                : "Criar conta";
        }
    }

    async function loadSession() {

        const loginLink = document.getElementById("loginLink");
        const registerLink = document.getElementById("registerLink");
        const userWelcome = document.getElementById("userWelcome");
        const logoutButton = document.getElementById("logoutButton");

        if (!loginLink || !registerLink ||
            !userWelcome || !logoutButton) {
            return;
        }

        try {
            const response = await fetch("/api/user", {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (response.status === 401) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "Não foi possível consultar a sessão."
                );
            }

            const user = await response.json();

            loginLink.classList.add("d-none");
            registerLink.classList.add("d-none");

            userWelcome.textContent = "Olá, " + user.name;

            userWelcome.classList.remove("d-none");
            logoutButton.classList.remove("d-none");

        } catch (error) {
            console.error("Erro de sessão:", error);
        }
    }

    async function logout() {

        const logoutButton = document.getElementById("logoutButton");

        logoutButton.disabled = true;

        try {
            await sendRequest(
                "/api/auth/logout",
                "POST"
            );

            window.location.assign("/");

        } catch (error) {
            logoutButton.disabled = false;
            alert(error.message);
        }
    }

    if (loginForm) {
        loginForm.addEventListener("submit", event => {
            handleAuth(event, "login");
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", event => {
            handleAuth(event, "register");
        });
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    loadSession();

})();
