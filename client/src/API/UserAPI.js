const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseErrorResponse(res, fallbackMessage) { // managed here to decouple the error parsing from the pages and contexts
    let message = fallbackMessage;

    try {
        const data = await res.json();
        message = data.error || data.message || message;
    } catch {
        const text = await res.text().catch(() => "");
        if (text) {
            message = text;
        }
    }

    const err = new Error(message);
    err.status = res.status;
    throw err;
}

export async function loginUser({ username, password }) {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: JSON_HEADERS,
        credentials: "include",
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Login failed (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function signupUser({ username, email, password }) {
    const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: JSON_HEADERS,
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Signup failed (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function verifyEmail({ token }) {
    const res = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Email verification failed (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function resendVerificationEmail() {
    const res = await fetch("/api/auth/verify-email", {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Resend verification email failed (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function logoutUser() {
    const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Logout failed (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function getCurrentUser() {
    const res = await fetch("/api/auth/me", {
        credentials: "include",
    });

    if (res.status === 401) {
        return null;
    }

    if (!res.ok) {
        await parseErrorResponse(res, `Auth check failed (${res.status})`);
    }

    return res.json();
}
export async function getWatchlist() {
    const res = await fetch("/api/dashboard/watchlist", {
        credentials: "include",
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Failed to fetch watchlist (${res.status})`);
    }

    return res.json();
}

export async function addToWatchlist(cardId, config = {}) {
    const res = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: JSON_HEADERS,
        credentials: "include",
        body: JSON.stringify({
            card_id: cardId,
            ...config,  // target_price, percentage_drop, lookback_days (all optional)
        }),
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Failed to add card (${res.status})`);
    }

    return res.json().catch(() => ({}));
}

export async function removeFromWatchlist(cardId) {
    const res = await fetch(`/api/dashboard/watchlist/${cardId}`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        await parseErrorResponse(res, `Failed to remove card (${res.status})`);
    }

    return res.json().catch(() => ({}));
}
