// Centralized Spotify API fetch with token refresh and error handling
export async function fetchWithRefresh(url, options = {}) {
    function getAccessTokenFromCookie() {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token'))
            ?.split('=')[1];
    }
    let accessToken = getAccessTokenFromCookie();
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (response.status === 401) {
        // Try to refresh the token
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
            accessToken = refreshData.access_token;
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                },
            });
        } else {
            // Redirect to login if refresh fails
            window.location.href = '/';
            throw new Error('Session expired. Please log in again.');
        }
    }
    return response;
}
