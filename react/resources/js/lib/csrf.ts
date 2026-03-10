const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || '';
    }

    return '';
};

export const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

export const updateCsrfToken = (newToken: string) => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag && newToken) {
        metaTag.setAttribute('content', newToken);
    }
};

export const getXsrfTokenFromCookie = () => {
    const raw = getCookie('XSRF-TOKEN');
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
};

export const syncCsrfTokenFromResponse = (response: Response) => {
    const nextToken =
        response.headers.get('X-CSRF-Token') ||
        response.headers.get('x-csrf-token');

    if (nextToken) {
        updateCsrfToken(nextToken);
    }
};

export const ensureCsrfCookie = async () => {
    await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
    });

    const latestXsrfToken = getXsrfTokenFromCookie();
    if (latestXsrfToken) {
        updateCsrfToken(latestXsrfToken);
    }
};

export const buildCsrfHeaders = (headers?: HeadersInit) => {
    const merged = new Headers(headers || {});
    const csrfToken = getCsrfToken();
    const xsrfToken = getXsrfTokenFromCookie();

    if (xsrfToken) {
        merged.set('X-XSRF-TOKEN', xsrfToken);
        // Prefer fresh cookie token and avoid stale meta token mismatch.
        merged.delete('X-CSRF-TOKEN');
    } else if (csrfToken) {
        merged.set('X-CSRF-TOKEN', csrfToken);
    }

    if (!merged.has('X-Requested-With')) {
        merged.set('X-Requested-With', 'XMLHttpRequest');
    }

    return merged;
};

export const fetchWithCsrfRetry = async (
    url: string,
    init: RequestInit = {},
    allowRetry = true,
): Promise<Response> => {
    const requestInit: RequestInit = {
        ...init,
        credentials: init.credentials || 'same-origin',
        headers: buildCsrfHeaders(init.headers),
    };

    let response = await fetch(url, requestInit);
    syncCsrfTokenFromResponse(response);

    if (response.status === 419 && allowRetry) {
        try {
            await ensureCsrfCookie();
        } catch {
            // Keep retry flow even if cookie refresh fails.
        }

        response = await fetch(url, {
            ...init,
            credentials: init.credentials || 'same-origin',
            headers: buildCsrfHeaders(init.headers),
        });
        syncCsrfTokenFromResponse(response);
    }

    return response;
};
