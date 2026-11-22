export function createStars(rating) {
    const value = Math.max(
        0,
        Math.min(5, Number(rating) || 0)
    );

    const stars = document.createElement('span');
    stars.className = 'rating-stars';

    stars.setAttribute('role', 'img');
    stars.setAttribute(
        'aria-label',
        `${value.toFixed(1).replace('.', ',')} de 5 estrelas`
    );

    const background = document.createElement('span');
    background.className = 'rating-stars-background';
    background.textContent = '★★★★★';

    const fill = document.createElement('span');
    fill.className = 'rating-stars-fill';
    fill.textContent = '★★★★★';
    fill.style.width = `${(value / 5) * 100}%`;

    stars.append(background, fill);

    return stars;
}

export function createRatingSummary(average, count) {
    const total = Math.max(0, Number(count) || 0);

    const value = total > 0
        ? Math.max(0, Math.min(5, Number(average) || 0))
        : 0;

    const container = document.createElement('div');
    container.className = 'rating-summary';

    const stars = createStars(value);
    stars.setAttribute('aria-hidden', 'true');
    stars.removeAttribute('role');
    stars.removeAttribute('aria-label');

    const number = document.createElement('strong');
    number.className = 'rating-number';

    number.textContent = total > 0
        ? value.toFixed(1).replace('.', ',')
        : '—';

    const quantity = document.createElement('span');
    quantity.className = 'rating-count';

    quantity.textContent = `(${total} ${
        total === 1 ? 'avaliação' : 'avaliações'
    })`;

    container.setAttribute(
        'aria-label',
        total > 0
            ? `Nota média ${number.textContent} de 5, baseada em ${total} avaliações`
            : 'Este produto ainda não possui avaliações'
    );

    container.append(stars, number, quantity);

    return container;
}
