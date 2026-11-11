
import './header.js';


const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');
const authMessage = document.querySelector('#authMessage');

const loginLink = document.querySelector('#loginLink');
const registerLink = document.querySelector('#registerLink');
const userWelcome = document.querySelector('#userWelcome');
const logoutButton = document.querySelector('#logoutButton');
const adminLink = document.querySelector('#adminLink');
const accountLink = document.querySelector('#accountLink');



function setAuthMessage(text, type = 'danger') {
    if (!authMessage) return;

    authMessage.className = `alert alert-${type}`;
    authMessage.textContent = text;
}

function getXsrfToken() {
    const cookie = document.cookie.split('; ')
        .find(item => item.startsWith('XSRF-TOKEN='));

    return cookie
        ? decodeURIComponent(
            cookie.substring('XSRF-TOKEN='.length)
        )
        : null;
}

async function apiRequest(path, options = {}) {
    const method = (options.method ?? 'GET').toUpperCase();

    const headers = {
        Accept: 'application/json'
    };

    if (method !== 'GET') {
        const csrf = await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!csrf.ok) {
            throw new Error(
                'Não foi possível inicializar a sessão.'
            );
        }

        const token = getXsrfToken();

        if (!token) {
            throw new Error('Token CSRF não encontrado.');
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
        const validation = Object.values(
            result.errors ?? {}
        ).flat().join(' ');

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

function getDestination() {
    const next = new URLSearchParams(
        window.location.search
    ).get('next');

    const allowed = [
        '/checkout.html',
        '/orders.html',
        '/account.html',
        '/admin/'
    ];

    return allowed.includes(next) ? next : '/';
}

function getCredentials(form, type) {
    const formData = new FormData(form);

    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    if (type === 'register') {
        credentials.name = formData.get('name');

        credentials.password_confirmation =
            formData.get('password_confirmation');
    }

    return credentials;
}

function showCartWarnings(warnings, destination) {
    const text = warnings
        .map(item => item.message)
        .join(' ');

    setAuthMessage(
        `Conta autenticada! Atenção ao carrinho: ${text}`,
        'warning'
    );

    const link = document.createElement('a');

    link.href = destination;
    link.className = 'btn btn-danger mt-2';

    link.textContent = destination === '/'
        ? 'Continuar para a loja'
        : 'Continuar';

    authMessage.appendChild(link);
}

async function handleAuth(event, type) {
    event.preventDefault();

    const form = event.currentTarget;

    const submitButton = document.querySelector(
        '#authSubmit'
    );

    const credentials = getCredentials(form, type);

    if (
        type === 'register' &&
        credentials.password !==
        credentials.password_confirmation
    ) {
        setAuthMessage(
            'As senhas informadas não coincidem.'
        );

        return;
    }

    const path = type === 'login'
        ? 'auth/login'
        : 'auth/register';

    const destination = getDestination();

    submitButton.disabled = true;
    submitButton.textContent = 'Processando...';

    try {
        const response = await apiRequest(path, {
            method: 'POST',
            data: credentials
        });

        const warnings =
            response.data?.cart_merge?.warnings ?? [];

        if (warnings.length > 0) {
            showCartWarnings(
                warnings,
                destination
            );

            form.classList.add('d-none');

            return;
        }

        setAuthMessage(
            'Autenticação realizada com sucesso!',
            'success'
        );

        window.location.assign(destination);

    } catch (error) {
        setAuthMessage(error.message);

    } finally {
        submitButton.disabled = false;

        submitButton.textContent = type === 'login'
            ? 'Entrar'
            : 'Criar conta';
    }
}

async function loadSession() {
    if (
        !loginLink ||
        !registerLink ||
        !userWelcome ||
        !logoutButton
    ) {
        return;
    }

    try {
        const user = await apiRequest('user');

        loginLink.classList.add('d-none');
        registerLink.classList.add('d-none');

        userWelcome.textContent = `Olá, ${user.name}`;

        userWelcome.classList.remove('d-none');
        logoutButton.classList.remove('d-none');

 
        if (accountLink) {
            accountLink.classList.remove('d-none');
        }

        if (adminLink && user.role === 'admin') {
            adminLink.classList.remove('d-none');
        }

    } catch (error) {
        if (error.status !== 401) {
            console.error(
                'Erro ao consultar sessão:',
                error
            );
        }
    }
}


async function logout() {
    if (!logoutButton) return;

    logoutButton.disabled = true;

    try {
        await apiRequest('auth/logout', {
            method: 'POST'
        });

        window.location.assign('/');

    } catch (error) {
        logoutButton.disabled = false;

        alert(error.message);
    }
}


function bindEvents() {
    if (loginForm) {
        loginForm.addEventListener('submit', event => {
            handleAuth(event, 'login');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', event => {
            handleAuth(event, 'register');
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}


function initializeAuth() {
    bindEvents();
    loadSession();
}

initializeAuth();
