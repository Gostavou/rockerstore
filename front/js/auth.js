"use strict";

(() => {

    // ELEMENTOS

    const loginForm = document.getElementById("loginForm");

    const registerForm = document.getElementById("registerForm");

    const authMessage = document.getElementById("authMessage");


    // MOSTRAR MENSAGENS

    function showAuthMessage(text, type = "danger") {
        if (!authMessage) {
            return;
        }

        authMessage.className = "alert alert-" + type;
        authMessage.textContent = text;
    }


    // LER TOKEN XSRF DO COOKIE

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


    // ENVIAR REQUISIÇÕES JSON

    async function sendRequest(url, method, data = null) {

        // Requisições de escrita precisam de CSRF.

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
            // Algumas respostas podem não ter JSON.
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


    // PROCESSAR LOGIN OU CADASTRO

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

        submitButton.disabled = true;
        submitButton.textContent = "Processando...";

        try {
            const result = await sendRequest(
                url,
                "POST",
                data
            );

            // O backend já realiza a fusão do carrinho.
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

                // Não redirecionar automaticamente:
                // o usuário precisa visualizar os avisos.
                const link = document.createElement("a");

                link.href = "/";
                link.className = "btn btn-danger mt-2";
                link.textContent = "Continuar para a loja";

                authMessage.appendChild(link);

                form.classList.add("d-none");

                return;
            }

            showAuthMessage(
                "Autenticação realizada com sucesso!",
                "success"
            );

            window.location.assign("/");

        } catch (error) {
            showAuthMessage(error.message);
        } finally {
            submitButton.disabled = false;

            submitButton.textContent = type === "login"
                ? "Entrar"
                : "Criar conta";
        }
    }


    // CONSULTAR SESSÃO ATUAL

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

            // /api/user retorna o Model diretamente.
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


    // ENCERRAR SESSÃO

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


    // EVENTOS

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
