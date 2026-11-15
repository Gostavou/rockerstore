
const themeStorageKey = 'rockerstore-theme';

let initialTheme = 'light';

try {
    initialTheme = localStorage.getItem(themeStorageKey) === 'dark'
        ? 'dark'
        : 'light';
} catch {
    initialTheme = 'light';
}

document.documentElement.setAttribute('data-bs-theme', initialTheme);

const currentHeader = document.querySelector('.site-header');

if (currentHeader) {
    currentHeader.outerHTML = `
        <header class="site-header sticky-top">
            <nav class="navbar navbar-expand-lg container py-3">

                <a class="navbar-brand logo" href="/">
                    ROCKER<span>STORE</span>
                </a>

                <button class="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarMenu"
                        aria-controls="navbarMenu"
                        aria-expanded="false"
                        aria-label="Abrir menu">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse"
                     id="navbarMenu">

                    <div class="navbar-nav ms-auto gap-lg-3
                                align-items-lg-center">

                        <a class="nav-link"
                           data-nav="home"
                           href="/">
                            Início
                        </a>

                        <a class="nav-link"
                           data-nav="products"
                           href="/#catalogo">
                            Produtos
                        </a>

                        <a class="nav-link"
                           data-nav="cart"
                           href="/cart.html">
                            Carrinho:
                            <strong id="cartCount">0</strong>
                        </a>

                        <a class="nav-link"
                           data-nav="orders"
                           href="/orders.html">
                            Meus pedidos
                        </a>

                        <a id="accountLink"
                           class="nav-link d-none"
                           data-nav="account"
                           href="/account.html">
                            Minha conta
                        </a>

                        <a id="adminLink"
                           class="nav-link d-none"
                           data-nav="admin"
                           href="/admin/">
                            Painel administrativo
                        </a>

                        <a id="loginLink"
                           class="nav-link"
                           href="/login.html">
                            Entrar
                        </a>

                        <a id="registerLink"
                           class="nav-link"
                           href="/register.html">
                            Criar conta
                        </a>

                        <span id="userWelcome"
                              class="nav-link d-none"></span>

                        <button id="themeToggle"
                                type="button"
                                class="theme-toggle"
                                aria-label="Ativar modo escuro"
                                title="Alternar tema">
                            <svg class="theme-icon theme-icon-sun"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true">
                                <circle cx="12" cy="12" r="4"></circle>
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path>
                            </svg>

                            <svg class="theme-icon theme-icon-moon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true">
                                <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path>
                            </svg>
                        </button>

                        <button id="logoutButton"
                                type="button"
                                class="btn btn-outline-light btn-sm d-none">
                            Sair
                        </button>

                    </div>
                </div>
            </nav>
        </header>
    `;

    const themeToggle = document.querySelector('#themeToggle');

    function updateThemeButton() {
        const isDark = document.documentElement.getAttribute(
            'data-bs-theme'
        ) === 'dark';

        themeToggle.setAttribute(
            'aria-pressed',
            String(isDark)
        );

        themeToggle.setAttribute(
            'aria-label',
            isDark ? 'Ativar modo claro' : 'Ativar modo escuro'
        );

        themeToggle.title = isDark
            ? 'Ativar modo claro'
            : 'Ativar modo escuro';
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute(
            'data-bs-theme'
        );

        const nextTheme = currentTheme === 'dark'
            ? 'light'
            : 'dark';

        document.documentElement.setAttribute(
            'data-bs-theme',
            nextTheme
        );

        try {
            localStorage.setItem(themeStorageKey, nextTheme);
        } catch {
        }

        updateThemeButton();
    });

    updateThemeButton();

    const path = window.location.pathname;

    let activePage = '';

    if (path === '/' || path === '/index.html') {
        activePage = 'home';
    } else if (path === '/product.html') {
        activePage = 'products';
    } else if (path === '/cart.html' || path === '/checkout.html') {
        activePage = 'cart';
    } else if (path === '/orders.html') {
        activePage = 'orders';
    } else if (path === '/account.html') {
        activePage = 'account';
    } else if (path.startsWith('/admin/')) {
        activePage = 'admin';
    }

    const activeLink = document.querySelector(
        `[data-nav="${activePage}"]`
    );

    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }

    async function loadHeaderCartCount() {
        try {
            const response = await fetch('/api/cart', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) return;

            const result = await response.json();

            const quantity = (result.data?.items ?? []).reduce(
                (total, item) => total + item.quantity,
                0
            );

            const cartCount = document.querySelector('#cartCount');

            if (cartCount) {
                cartCount.textContent = quantity;
            }

        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
        }
    }

    loadHeaderCartCount();
}
