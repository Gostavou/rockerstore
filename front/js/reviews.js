import { createStars, createRatingSummary } from './rating.js';

export function initializeReviews(product, apiRequest) {
    const panel = document.querySelector('#reviewsPanel');

    if (!panel) return;

    const $ = selector => panel.querySelector(selector);

    const form = $('#reviewForm');
    const eligibility = $('#reviewEligibility');
    const message = $('#reviewActionMessage');
    const submitButton = $('#reviewSubmit');
    const ratingButtons = [
        ...panel.querySelectorAll('[data-review-rating]')
    ];

    let selectedRating = 0;
    let myReview = null;
    let canReview = false;
    let signedIn = false;
    let currentPage = 1;
    let lastPage = 1;
    let busy = false;

    function createElement(tag, text = '', className = '') {
        const element = document.createElement(tag);
        element.textContent = text;
        element.className = className;
        return element;
    }

    function showMessage(text, type = 'danger') {
        message.className = `alert alert-${type} mt-3`;
        message.textContent = text;
    }

    function paintStars(value) {
        for (const button of ratingButtons) {
            const rating = Number(button.dataset.reviewRating);

            button.classList.toggle(
                'is-filled',
                rating <= value
            );

            button.setAttribute(
                'aria-pressed',
                String(rating === selectedRating)
            );
        }
    }

    function selectRating(value) {
        selectedRating = value;
        paintStars(value);
    }

    function openForm() {
        $('#reviewFormTitle').textContent = myReview
            ? 'Editar avaliação'
            : 'Avaliar produto';

        submitButton.textContent = myReview
            ? 'Salvar alterações'
            : 'Publicar avaliação';

        $('#reviewComment').value = myReview?.comment ?? '';

        selectRating(Number(myReview?.rating ?? 0));

        eligibility.classList.add('d-none');
        form.classList.remove('d-none');

        $('#reviewComment').focus();
    }

    function closeForm() {
        form.classList.add('d-none');
        eligibility.classList.remove('d-none');
    }

    function renderControls() {
        eligibility.replaceChildren();
        eligibility.classList.remove('d-none');
        form.classList.add('d-none');

        if (!signedIn) {
            const text = createElement(
                'p',
                'Faça login para verificar se você pode avaliar este produto.',
                'text-secondary mb-2'
            );

            const link = createElement(
                'a',
                'Entrar na minha conta',
                'btn btn-outline-light btn-sm'
            );

            link.href = '/login.html';

            eligibility.append(text, link);
            return;
        }

        if (myReview) {
            const text = createElement(
                'p',
                'Sua avaliação já está publicada.',
                'text-secondary mb-3'
            );

            const actions = createElement(
                'div',
                '',
                'd-flex gap-2 flex-wrap'
            );

            const editButton = createElement(
                'button',
                'Editar avaliação',
                'btn btn-outline-light btn-sm'
            );

            editButton.type = 'button';
            editButton.addEventListener('click', openForm);

            const deleteButton = createElement(
                'button',
                'Excluir avaliação',
                'btn btn-outline-danger btn-sm'
            );

            deleteButton.type = 'button';
            deleteButton.addEventListener(
                'click',
                deleteReview
            );

            actions.append(editButton, deleteButton);
            eligibility.append(text, actions);

            return;
        }

        if (canReview) {
            const text = createElement(
                'p',
                'Compra verificada! Você já pode avaliar este produto.',
                'text-secondary mb-3'
            );

            const button = createElement(
                'button',
                'Escrever avaliação',
                'btn btn-danger btn-sm'
            );

            button.type = 'button';
            button.addEventListener('click', openForm);

            eligibility.append(text, button);

            return;
        }

        eligibility.appendChild(
            createElement(
                'p',
                'Você poderá avaliar este instrumento após recebê-lo. É necessário possuir um pedido com status Entregue.',
                'text-secondary mb-0'
            )
        );
    }

    async function loadViewer() {
        try {
            const response = await apiRequest(
                `products/${product.id}/reviews/me`
            );

            signedIn = true;
            myReview = response.data?.my_review ?? null;
            canReview = Boolean(response.data?.can_review);

        } catch (error) {
            if (error.status === 401) {
                signedIn = false;
                myReview = null;
                canReview = false;
            } else {
                eligibility.classList.remove('d-none');
                form.classList.add('d-none');

                eligibility.textContent =
                    'Não foi possível verificar sua permissão para avaliar. Atualize a página.';

                return;
            }
        }

        renderControls();
    }

    function renderOverview(data) {
        const average = Number(data.rating_average ?? 0);
        const total = Number(data.rating_count ?? 0);
        const distribution = data.review_distribution ?? {};

        $('#reviewOverview').replaceChildren(
            createRatingSummary(average, total)
        );

        const container = $('#reviewDistribution');
        container.replaceChildren();

        for (let rating = 5; rating >= 1; rating--) {
            const quantity = Number(distribution[rating] ?? 0);

            const row = createElement(
                'div',
                '',
                'review-distribution-row'
            );

            const label = createElement(
                'span',
                `${rating} ★`,
                'review-distribution-label'
            );

            const track = createElement(
                'div',
                '',
                'review-distribution-track'
            );

            const fill = createElement(
                'div',
                '',
                'review-distribution-fill'
            );

            fill.style.width = total > 0
                ? `${(quantity / total) * 100}%`
                : '0%';

            const count = createElement(
                'span',
                String(quantity),
                'review-distribution-count'
            );

            track.appendChild(fill);
            row.append(label, track, count);
            container.appendChild(row);
        }
    }

    function createReviewCard(review) {
        const card = createElement(
            'article',
            '',
            'review-entry'
        );

        const heading = createElement(
            'div',
            '',
            'd-flex align-items-center justify-content-between flex-wrap gap-2 mb-2'
        );

        const author = createElement(
            'strong',
            review.author?.name ?? 'Cliente'
        );

        const date = createElement(
            'span',
            new Date(review.created_at).toLocaleDateString('pt-BR'),
            'small text-secondary'
        );

        heading.append(author, date);

        const rating = createStars(review.rating);

        const verified = createElement(
            'p',
            'Compra verificada',
            'review-verified'
        );

        const comment = createElement(
            'p',
            review.comment,
            'review-comment mb-0'
        );

        card.append(
            heading,
            rating,
            verified,
            comment
        );

        return card;
    }

    async function loadReviews() {
        const response = await apiRequest(
            `products/${product.id}/reviews?page=${currentPage}`
        );

        lastPage = Math.max(
            1,
            Number(response.meta?.last_page ?? 1)
        );

        if (currentPage > lastPage) {
            currentPage = lastPage;
            return loadReviews();
        }

        const reviews = response.data ?? [];
        const list = $('#reviewsList');

        list.replaceChildren();

        if (reviews.length === 0) {
            list.appendChild(
                createElement(
                    'div',
                    'Este produto ainda não possui avaliações.',
                    'checkout-card text-secondary'
                )
            );
        } else {
            for (const review of reviews) {
                list.appendChild(createReviewCard(review));
            }
        }

        $('#reviewPagination').classList.toggle(
            'd-none',
            lastPage <= 1
        );

        $('#reviewPageInfo').textContent =
            `Página ${currentPage} de ${lastPage}`;

        $('#reviewPrev').disabled = currentPage <= 1;
        $('#reviewNext').disabled = currentPage >= lastPage;
    }

    async function refreshOverview() {
        const response = await apiRequest(
            `products/${product.id}`
        );

        const updated = response.data;

        renderOverview(updated);

        const productRating = document.querySelector(
            '#productRating'
        );

        if (productRating) {
            productRating.replaceChildren(
                createRatingSummary(
                    updated.rating_average,
                    updated.rating_count
                )
            );
        }
    }

    async function refreshAll() {
        await Promise.all([
            loadViewer(),
            loadReviews(),
            refreshOverview()
        ]);
    }

    async function saveReview(event) {
        event.preventDefault();

        if (busy) return;

        const comment = $('#reviewComment').value.trim();

        if (selectedRating < 1 || selectedRating > 5) {
            showMessage('Selecione uma nota de 1 a 5 estrelas.');
            return;
        }

        if (comment.length < 10 || comment.length > 1000) {
            showMessage(
                'O comentário deve ter entre 10 e 1000 caracteres.'
            );
            return;
        }

        const editing = myReview !== null;

        busy = true;
        submitButton.disabled = true;

        try {
            await apiRequest(
                editing
                    ? `products/${product.id}/reviews/me`
                    : `products/${product.id}/reviews`,
                {
                    method: editing ? 'PUT' : 'POST',
                    data: {
                        rating: selectedRating,
                        comment
                    }
                }
            );

            closeForm();

            showMessage(
                editing
                    ? 'Avaliação atualizada com sucesso!'
                    : 'Avaliação publicada com sucesso!',
                'success'
            );

            await refreshAll();

        } catch (error) {
            showMessage(error.message);

        } finally {
            busy = false;
            submitButton.disabled = false;
        }
    }

    async function deleteReview() {
        if (busy || !myReview) return;

        const confirmed = window.confirm(
            'Deseja realmente excluir sua avaliação?'
        );

        if (!confirmed) return;

        busy = true;

        try {
            await apiRequest(
                `products/${product.id}/reviews/me`,
                {
                    method: 'DELETE'
                }
            );

            showMessage(
                'Avaliação excluída com sucesso!',
                'success'
            );

            await refreshAll();

        } catch (error) {
            showMessage(error.message);

        } finally {
            busy = false;
        }
    }

    for (const button of ratingButtons) {
        const value = Number(button.dataset.reviewRating);

        button.addEventListener('mouseenter', () => {
            paintStars(value);
        });

        button.addEventListener('mouseleave', () => {
            paintStars(selectedRating);
        });

        button.addEventListener('focus', () => {
            paintStars(value);
        });

        button.addEventListener('blur', () => {
            paintStars(selectedRating);
        });

        button.addEventListener('click', () => {
            selectRating(value);
        });
    }

    $('#reviewCancel').addEventListener(
        'click',
        closeForm
    );

    form.addEventListener('submit', saveReview);

    $('#reviewPrev').addEventListener('click', async () => {
        if (currentPage <= 1) return;

        currentPage--;

        try {
            await loadReviews();
        } catch (error) {
            showMessage(error.message);
        }
    });

    $('#reviewNext').addEventListener('click', async () => {
        if (currentPage >= lastPage) return;

        currentPage++;

        try {
            await loadReviews();
        } catch (error) {
            showMessage(error.message);
        }
    });

    renderOverview(product);
    panel.classList.remove('d-none');

    loadReviews().catch(error => {
        showMessage(
            'Não foi possível carregar as avaliações: ' +
            error.message
        );
    });

    loadViewer();
}
