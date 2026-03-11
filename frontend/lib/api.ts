import { auth } from '@clerk/nextjs/server';

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    if (!headers.has('Authorization')) {
        // Try to get token only when no Authorization header was provided.
        let token = null;
        try {
            const { getToken } = await auth();
            token = await getToken();
        } catch (e) {
            // Auth might not be required or available
        }
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    // Prevent caching for dynamic data by default if not specified
    const fetchOptions: RequestInit = {
        ...options,
        headers,
        cache: options.cache || 'no-store'
    };

    // Clean URL parsing to avoid double slashes when composing absolute endpoint URLs.
    let baseUrl = API_URL;
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${path}`;

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        let errorDetails = "";
        try { errorDetails = await response.text(); } catch (e) { }
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    return response.json();
}
