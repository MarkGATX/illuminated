// Centralized Spotify API fetch with token refresh and error handling
export async function fetchWithRefresh(url, options = {}, setApiError = null) {
    function getAccessTokenFromCookie() {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token'))
            ?.split('=')[1];
    }

    function setAccessTokenInCookie(token) {
        document.cookie = `access_token=${token}; path=/;`; // Update the cookie with the new token
        console.log('Access token updated in cookies:', token); // Debugging log
    }

    let accessToken = getAccessTokenFromCookie();
    let response;
    let retries = 0;

    while (retries < 2) {
        try {
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401) {
                console.warn('Access token expired. Attempting to refresh.'); // Debugging log
                const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                const refreshData = await refreshRes.json();

                if (refreshData.access_token) {
                    accessToken = refreshData.access_token;
                    setAccessTokenInCookie(accessToken); // Update the cookie with the new token
                    retries++;
                    continue; // Retry original request
                } else {
                    console.error('Token refresh failed. Redirecting to login.'); // Debugging log
                    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'; // Clear cookie
                    window.location.href = '/';
                    throw new Error('Session expired. Please log in again.');
                }
            }

            // Handle 403 Forbidden (account used elsewhere or token revoked)
            if (response.status === 403) {
                console.error('Access forbidden. Token may be revoked or account used elsewhere. Redirecting to login.');
                document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'; // Clear cookie
                window.location.href = '/';
                throw new Error('Access forbidden. Please log in again.');
            }

            if (response.status === 502 && setApiError) {
                setApiError('Spotify service is temporarily unavailable (502 Bad Gateway). Please try again later.');
                return null;
            }

            if (response.status === 504 && setApiError) {
                setApiError('Spotify service timed out (504 Gateway Timeout). Please try again in a moment.');
                return null;
            }

            if (response.status === 500 && setApiError) {
                setApiError('Spotify service encountered an internal error (500 Internal Server Error). Please try again later.');
                return null;
            }

            break;
        } catch (err) {
            console.error('Network error during fetch:', err); // Debugging log
            if (setApiError) {
                setApiError('Network error. Please check your connection and try again.');
            }
            return null;
        }
    }

    if (response && response.ok && setApiError) {
        setApiError(null); // Clear error on success
    }

    return response;
}
