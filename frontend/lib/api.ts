import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.API_URL || 'http://127.0.0.1:8000';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
    // Try to get token if auth is available
    let token = null;
    try {
        const { getToken } = await auth();
        token = await getToken();
    } catch (e) {
        // Auth might not be required or available
    }

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Prevent caching for dynamic data by default if not specified
    const fetchOptions: RequestInit = {
        ...options,
        headers,
        cache: options.cache || 'no-store'
    };

    // Clean URL parsing to avoid double slashes, e.g. http://127.0.0.1:8000//matches
    let baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${path}`;

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
