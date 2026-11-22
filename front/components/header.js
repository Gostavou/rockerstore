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

const svg = (content, className = 'header-icon') => `
    <svg class="${className}"
         xmlns="http://www.w3.org/2000/svg"
         width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
        ${content}
    </svg>
`;

const icons = {
    home: svg('<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-7h6v7"/>'),
    products: svg('<path d="M9 18V5l12-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>'),
    orders: svg('<path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"/><path d="m3.3 7.7 8.7 4.4 8.7-4.4"/><path d="M12 12.1V21"/>'),
    favorites: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'),
    account: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    admin: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 2h3l2.6 13h13l2.2-9H5"/>', 'header-action-icon'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'theme-icon theme-icon-sun'),
    moon: svg('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>', 'theme-icon theme-icon-moon'),
    exit: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>', 'header-action-icon')
};

const currentHeader = document.querySelector('.site-header');

if (currentHeader) {
    currentHeader.outerHTML = `
        <header class="site-header sticky-top">
            <nav class="navbar navbar-expand-xl container py-3 rock-navbar">
                <a class="navbar-brand logo" href="/">
                    ROCKER<span>STORE</span>
                </a>

                <div class="collapse navbar-collapse order-3 order-xl-2"
                     id="navbarMenu">
                    <div class="navbar-nav header-nav ms-xl-auto align-items-xl-center">
                        <a class="nav-link header-nav-link"
                           data-nav="home" href="/">
                            ${icons.home}
                            <span>Início</span>
                        </a>

                        <a class="nav-link header-nav-link"
                           data-nav="products" href="/#catalogo">
                            ${icons.products}
                            <span>Produtos</span>
                        </a>

                        <a class="nav-link header-nav-link"
                           data-nav="orders" href="/pages/orders/orders.html">
                            ${icons.orders}
                            <span>Meus pedidos</span>
                        </a>

                        <a id="favoritesLink"
                           class="nav-link header-nav-link d-none"
                           data-nav="favorites" href="/pages/favorites/favorites.html">
                            ${icons.favorites}
                            <span>Favoritos</span>
                        </a>

                        <a id="accountLink"
                           class="nav-link header-nav-link d-none"
                           data-nav="account" href="/pages/account/account.html">
                            ${icons.account}
                            <span>Minha conta</span>
                        </a>

                        <a id="adminLink"
                           class="nav-link header-nav-link d-none"
                           data-nav="admin" href="/pages/admin/index.html">
                            ${icons.admin}
                            <span>Painel</span>
                        </a>
                    </div>

                    <div class="header-auth-links">
                        <a id="loginLink"
                           class="nav-link header-auth-link"
                           href="/pages/auth/login.html">
                            Entrar
                        </a>

                        <a id="registerLink"
                           class="nav-link header-register-link"
                           href="/pages/auth/register.html">
                            Criar conta
                        </a>

                        <span id="userWelcome"
                              class="header-welcome d-none"></span>
                    </div>
                </div>

                <div class="header-actions order-2 order-xl-3 ms-auto ms-xl-0">
                    <a id="headerCartLink"
                       class="header-icon-action header-cart-link"
                       href="/pages/cart/cart.html"
                       data-nav="cart"
                       aria-label="Carrinho vazio"
                       title="Carrinho">
                        ${icons.cart}
                        <span id="cartCount"
                              class="header-cart-count d-none"
                              aria-hidden="true">0</span>
                    </a>

                    <button id="themeToggle"
                            type="button"
                            class="theme-toggle header-icon-action"
                            aria-label="Ativar modo escuro"
                            title="Alternar tema">
                        ${icons.sun}
                    </button>

                    <button id="logoutButton"
                            type="button"
                            class="header-icon-action header-logout d-none"
                            aria-label="Sair da conta"
                            title="Sair da conta">
                        ${icons.exit}
                        <span class="header-logout-text">Sair</span>
                    </button>

                    <button class="navbar-toggler d-xl-none"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbarMenu"
                            aria-controls="navbarMenu"
                            aria-expanded="false"
                            aria-label="Abrir menu">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
            </nav>
        </header>
    `;

    const themeToggle = document.querySelector('#themeToggle');
    const cartCount = document.querySelector('#cartCount');
    const cartLink = document.querySelector('#headerCartLink');

    function updateThemeButton() {
        const isDark = document.documentElement.getAttribute(
            'data-bs-theme'
        ) === 'dark';

        themeToggle.setAttribute('aria-pressed', String(isDark));

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
    } else if (path === '/pages/product/product.html') {
        activePage = 'products';
    } else if (
        path === '/pages/cart/cart.html' ||
        path === '/pages/checkout/checkout.html'
    ) {
        activePage = 'cart';
    } else if (path === '/pages/orders/orders.html') {
        activePage = 'orders';
    } else if (path === '/pages/favorites/favorites.html') {
        activePage = 'favorites';
    } else if (path === '/pages/account/account.html') {
        activePage = 'account';
    } else if (path === '/pages/admin/index.html') {
        activePage = 'admin';
    }

    const activeLink = document.querySelector(
        `[data-nav="${activePage}"]`
    );

    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }

    function updateCartBadge() {
        const quantity =
            Number.parseInt(cartCount.textContent, 10) || 0;

        cartCount.classList.toggle('d-none', quantity <= 0);

        cartLink.setAttribute(
            'aria-label',
            quantity > 0
                ? `Carrinho com ${quantity} ${quantity === 1 ? 'item' : 'itens'}`
                : 'Carrinho vazio'
        );
    }

    new MutationObserver(updateCartBadge).observe(cartCount, {
        childList: true,
        characterData: true,
        subtree: true
    });

    updateCartBadge();

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
                (total, item) =>
                    total + Number(item.quantity || 0),
                0
            );

            cartCount.textContent = quantity;

        } catch (error) {
            console.error(
                'Erro ao carregar carrinho:',
                error
            );
        }
    }

    loadHeaderCartCount();
}

const siteFooter = document.querySelector('footer.footer');

if (siteFooter) {
    siteFooter.className = 'footer py-4';

    siteFooter.innerHTML = `
        <div class="container">
            <div class="row align-items-center gy-3">
                <div class="col-md-6 text-center text-md-start">
                    <a href="/" class="footer-logo">
                        ROCKER<span>STORE</span>
                    </a>

                    <p class="footer-description mb-0 mt-2">
                        Instrumentos para quem vive a música.
                    </p>
                </div>

                <div class="col-md-6">
                    <nav class="footer-links justify-content-center justify-content-md-end">
                        <a href="/">Início</a>
                        <a href="/#catalogo">Produtos</a>
                        <a href="/pages/cart/cart.html">Carrinho</a>
                    </nav>
                </div>
            </div>

            <div class="footer-bottom text-center">
                <small>RockerStore &copy; 2026</small>
            </div>
        </div>
    `;
}