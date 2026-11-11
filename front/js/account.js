import './header.js';

const $ = selector => document.querySelector(selector);

const accountLoading = $('#accountLoading');
const accountContent = $('#accountContent');
const accountLoginNotice = $('#accountLoginNotice');

const profileForm = $('#profileForm');
const profileMessage = $('#profileMessage');
const saveProfileButton = $('#saveProfileButton');

const addressesContainer = $('#accountAddresses');
const addressMessage = $('#addressMessage');
const emptyAddresses = $('#emptyAddresses');

const addressPanel = $('#accountAddressPanel');
const addressForm = $('#accountAddressForm');
const addressFormTitle = $('#addressFormTitle');
const saveAddressButton = $('#saveAccountAddressButton');

let editingAddressId = null;
let addressBusy = false;

function createElement(tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
}

function showMessage(element, text, type = 'success') {
    element.className = `alert alert-${type} my-3`;
    element.textContent = text;
}

function hideMessage(element) {
    element.className = 'd-none';
    element.textContent = '';
}

function getXsrfToken() {
    const cookie = document.cookie.split('; ')
        .find(value => value.startsWith('XSRF-TOKEN='));

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
        const csrfResponse = await fetch(
            '/sanctum/csrf-cookie',
            {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        if (!csrfResponse.ok) {
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

    const result = await response
        .json()
        .catch(() => ({}));

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

/* ========================================
   DADOS DO USUÁRIO
======================================== */

async function loadUser() {
    try {
        const user = await apiRequest('user');

        $('#accountName').value = user.name ?? '';
        $('#accountEmail').value = user.email ?? '';

        accountContent.classList.remove('d-none');

        return true;

    } catch (error) {
        if (error.status === 401) {
            accountLoginNotice.classList.remove('d-none');
        } else {
            accountLoginNotice.classList.remove('d-none');

            showMessage(
                accountLoginNotice,
                `Não foi possível carregar a conta: ${error.message}`,
                'danger'
            );
        }

        return false;

    } finally {
        accountLoading.classList.add('d-none');
    }
}

async function saveProfile(event) {
    event.preventDefault();

    hideMessage(profileMessage);

    const data = {
        name: $('#accountName').value.trim(),
        email: $('#accountEmail').value.trim()
    };

    if (!data.name || !data.email) {
        showMessage(
            profileMessage,
            'Preencha nome e e-mail.',
            'danger'
        );
        return;
    }

    saveProfileButton.disabled = true;

    try {
        const response = await apiRequest('user', {
            method: 'PUT',
            data
        });

        $('#accountName').value = response.data.name;
        $('#accountEmail').value = response.data.email;

        const welcome = $('#userWelcome');

        if (welcome) {
            welcome.textContent =
                `Olá, ${response.data.name}`;
        }

        showMessage(
            profileMessage,
            'Seus dados foram atualizados com sucesso.'
        );

    } catch (error) {
        showMessage(
            profileMessage,
            error.message,
            'danger'
        );

    } finally {
        saveProfileButton.disabled = false;
    }
}

/* ========================================
   ENDEREÇOS
======================================== */

function formatAddress(address) {
    const street = `${address.street}, ${address.number}`;

    const district = address.district;
    const city = `${address.city}/${address.state}`;

    const zip = `CEP: ${address.zip_code}`;

    return [street, district, city, zip];
}

function createAddressCard(address) {
    const column = createElement(
        'div', '', 'col-md-6'
    );

    const card = createElement(
        'article', '', 'account-address-card h-100'
    );

    const heading = createElement(
        'h3',
        address.recipient_name,
        'h6 fw-bold mb-3'
    );

    const details = createElement(
        'div', '', 'account-address-details'
    );

    for (const line of formatAddress(address)) {
        details.appendChild(
            createElement('p', line, 'mb-1')
        );
    }

    if (address.complement) {
        details.appendChild(
            createElement(
                'p',
                `Complemento: ${address.complement}`,
                'mb-1'
            )
        );
    }

    const actions = createElement(
        'div', '', 'd-flex gap-2 flex-wrap mt-4'
    );

    const editButton = createElement(
        'button',
        'Editar',
        'btn btn-outline-light btn-sm'
    );

    editButton.type = 'button';

    editButton.addEventListener('click', () => {
        openAddressForm(address);
    });

    const deleteButton = createElement(
        'button',
        'Excluir',
        'btn btn-outline-danger btn-sm'
    );

    deleteButton.type = 'button';

    deleteButton.addEventListener('click', () => {
        deleteAddress(address.id);
    });

    actions.append(editButton, deleteButton);
    card.append(heading, details, actions);
    column.appendChild(card);

    return column;
}

async function loadAddresses() {
    try {
        const response = await apiRequest('addresses');
        const addresses = response.data ?? [];

        addressesContainer.replaceChildren();

        for (const address of addresses) {
            addressesContainer.appendChild(
                createAddressCard(address)
            );
        }

        emptyAddresses.classList.toggle(
            'd-none',
            addresses.length !== 0
        );

    } catch (error) {
        showMessage(
            addressMessage,
            error.message,
            'danger'
        );
    }
}

function openAddressForm(address = null) {
    if (addressBusy) return;

    hideMessage(addressMessage);
    addressForm.reset();

    editingAddressId = address?.id ?? null;

    if (address) {
        addressFormTitle.textContent = 'Editar endereço';

        const fields = [
            'recipient_name',
            'zip_code',
            'street',
            'number',
            'complement',
            'district',
            'city',
            'state'
        ];

        for (const field of fields) {
            const input = addressForm.elements.namedItem(field);

            if (input) {
                input.value = address[field] ?? '';
            }
        }

        saveAddressButton.textContent = 'Salvar alterações';

    } else {
        addressFormTitle.textContent = 'Novo endereço';
        saveAddressButton.textContent = 'Salvar endereço';
    }

    addressPanel.classList.remove('d-none');

    addressPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    $('#accountRecipient').focus({
        preventScroll: true
    });
}

function closeAddressForm() {
    if (addressBusy) return;

    editingAddressId = null;
    addressForm.reset();
    addressPanel.classList.add('d-none');

    saveAddressButton.textContent = 'Salvar endereço';
}

async function saveAddress(event) {
    event.preventDefault();

    if (addressBusy) return;

    hideMessage(addressMessage);

    const data = Object.fromEntries(
        new FormData(addressForm)
    );

    data.recipient_name = data.recipient_name.trim();
    data.zip_code = data.zip_code.trim();
    data.street = data.street.trim();
    data.number = data.number.trim();
    data.district = data.district.trim();
    data.city = data.city.trim();
    data.state = data.state.trim().toUpperCase();
    data.complement = data.complement.trim() || null;

    const editing = editingAddressId !== null;

    const path = editing
        ? `addresses/${editingAddressId}`
        : 'addresses';

    const method = editing ? 'PUT' : 'POST';

    addressBusy = true;
    saveAddressButton.disabled = true;

    try {
        await apiRequest(path, {
            method,
            data
        });

        editingAddressId = null;
        addressForm.reset();
        addressPanel.classList.add('d-none');

        showMessage(
            addressMessage,
            editing
                ? 'Endereço atualizado com sucesso.'
                : 'Endereço cadastrado com sucesso.'
        );

        await loadAddresses();

    } catch (error) {
        showMessage(
            addressMessage,
            error.message,
            'danger'
        );

    } finally {
        addressBusy = false;
        saveAddressButton.disabled = false;
    }
}

async function deleteAddress(addressId) {
    if (addressBusy) return;

    const confirmed = window.confirm(
        'Deseja realmente excluir este endereço?'
    );

    if (!confirmed) return;

    hideMessage(addressMessage);
    addressBusy = true;

    try {
        await apiRequest(`addresses/${addressId}`, {
            method: 'DELETE'
        });

        if (editingAddressId === addressId) {
            editingAddressId = null;
            addressPanel.classList.add('d-none');
            addressForm.reset();
        }

        showMessage(
            addressMessage,
            'Endereço excluído com sucesso.'
        );

        await loadAddresses();

    } catch (error) {
        showMessage(
            addressMessage,
            error.message,
            'danger'
        );

    } finally {
        addressBusy = false;
    }
}

/* ========================================
   INICIALIZAÇÃO
======================================== */

function bindEvents() {
    profileForm.addEventListener(
        'submit',
        saveProfile
    );

    addressForm.addEventListener(
        'submit',
        saveAddress
    );

    $('#newAccountAddressButton').addEventListener(
        'click',
        () => openAddressForm()
    );

    $('#cancelAddressButton').addEventListener(
        'click',
        closeAddressForm
    );
}

async function initializeAccount() {
    bindEvents();

    const authenticated = await loadUser();

    if (!authenticated) return;

    await loadAddresses();
}

initializeAccount();
