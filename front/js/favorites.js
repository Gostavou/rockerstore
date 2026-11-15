const favoriteIds = new Set();

let favoriteProducts = [];
let authenticated = false;

function getXsrfToken() {
    const cookie = document.cookie.split('; ')
        .find(item => item.startsWith('XSRF-TOKEN='));

    return cookie
        ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length))
        : null;
}

async function apiRequest(path, options = {}) {
    const method = options.method ?? 'GET';
    const headers = {
        Accept: 'application/json'
    };

    if (method !== 'GET') {
        const response = await fetch('/sanctum/csrf-cookie', {
            credentials: 'same-origin',
            headers
        });

        if (!response.ok) {
            throw new Error('Não foi possível validar a sessão.');
        }

        const token = getXsrfToken();

        if (!token) {
            throw new Error('Token CSRF indisponível.');
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
        const error = new Error(
            result.message || `Erro HTTP ${response.status}`
        );

        error.status = response.status;
        throw error;
    }

    return result;
}

function updateButton(button) {
    const productId = Number(button.dataset.favoriteId);
    const active = favoriteIds.has(productId);

    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));

    const label = active
        ? 'Remover dos favoritos'
        : 'Adicionar aos favoritos';

    button.setAttribute('aria-label', label);
    button.title = label;
}

function updateButtons() {
    document.querySelectorAll('[data-favorite-id]')
        .forEach(updateButton);
}

async function initializeFavorites() {
    try {
        const response = await apiRequest('favorites');

        authenticated = true;
        favoriteProducts = response.data ?? [];

        favoriteIds.clear();

        for (const product of favoriteProducts) {
            favoriteIds.add(Number(product.id));
        }

        updateButtons();

    } catch (error) {
        if (error.status === 401) {
            authenticated = false;
            return;
        }

        throw error;
    }
}

const favoritesReady = initializeFavorites();

favoritesReady.catch(error => {
    console.error('Erro ao carregar favoritos:', error);
});


export function createFavoriteButton(productId) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'favorite-button position-relative z-2 flex-shrink-0';
    button.dataset.favoriteId = String(productId);

    button.innerHTML = `
        <svg viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.8"
             stroke-linecap="round"
             stroke-linejoin="round"
             aria-hidden="true">
            <path d="M12 2.5 15.1 8.8 22 9.8 17 14.7 18.2 21.5 12 18.2 5.8 21.5 7 14.7 2 9.8 8.9 8.8Z"></path>
        </svg>
    `;

    updateButton(button);

    favoritesReady.then(() => {
        updateButton(button);
    }).catch(() => {});

    button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();

        if (button.disabled) return;

        button.disabled = true;

        try {
            await favoritesReady;

            if (!authenticated) {
                window.location.assign(
                    '/login.html?next=/favorites.html'
                );

                return;
            }

            const id = Number(productId);
            const isFavorite = favoriteIds.has(id);

            if (isFavorite) {
                await apiRequest(`favorites/${id}`, {
                    method: 'DELETE'
                });

                favoriteIds.delete(id);

                favoriteProducts = favoriteProducts.filter(
                    product => Number(product.id) !== id
                );
            } else {
                await apiRequest('favorites', {
                    method: 'POST',
                    data: {
                        product_id: id
                    }
                });

                favoriteIds.add(id);
            }

            updateButtons();

            document.dispatchEvent(new CustomEvent(
                'favorites:changed',
                {
                    detail: {
                        productId: id,
                        active: !isFavorite
                    }
                }
            ));

        } catch (error) {
            alert(error.message);

        } finally {
            button.disabled = false;
        }
    });

    return button;
}


export async function getFavoriteProducts() {
    await favoritesReady;

    if (!authenticated) {
        window.location.assign(
            '/login.html?next=/favorites.html'
        );

        return null;
    }

    return [...favoriteProducts];
}
