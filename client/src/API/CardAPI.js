const CARD_API_BASE = '/api/search';
const CARD_DETAIL_API_BASE = '/api/detail';

async function parseErrorResponse(res, fallbackMessage) {
    let message = fallbackMessage;

    try {
        const data = await res.json();
        message = data.error || data.message || message;
    } catch {
        const text = await res.text().catch(() => '');
        if (text) {
            message = text;
        }
    }

    const err = new Error(message);
    err.status = res.status;
    throw err;
}

export async function searchCards({ searchQuery, filterType }) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', searchQuery || 'format:standard');

    if (filterType && filterType !== 'All') {
        queryParams.append('type', filterType);
    }

    const res = await fetch(`${CARD_API_BASE}/?${queryParams.toString()}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Card search failed (${res.status})`);
    }

    return res.json();
}

export async function getCardDetail(cardId) {
    const res = await fetch(`${CARD_DETAIL_API_BASE}/${cardId}`, {
        credentials: 'include',
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Card detail request failed (${res.status})`);
    }

    return res.json();
}