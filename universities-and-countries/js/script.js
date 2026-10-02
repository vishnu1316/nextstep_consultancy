document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.country-card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            const href = card.getAttribute('onclick');
            if (href) {
                const match = href.match(/window\.location\.href='([^']+)'/);
                if (match && match[1]) {
                    window.location.href = match[1];
                }
            }
        });
    });
});
