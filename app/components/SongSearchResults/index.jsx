import React, { useState, useEffect } from 'react';
import styles from './songSearchResults.module.css';

function getAccessTokenFromCookie() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token'))
        ?.split('=')[1];
}

export default function SongSearchResults({ query, onTrackSelect }) {
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalResults, setTotalResults] = useState(0);

    // Fetch results when query or page changes
    useEffect(() => {
        if (!query) return;
        let ignore = false;
        async function fetchResults() {
            setSearchLoading(true);
            setSearchError(null);
            try {
                const accessToken = getAccessTokenFromCookie();
                const offset = page * 10;
                const res = await fetch(
                    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&offset=${offset}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                if (!ignore) {
                    setSearchResults(data.tracks?.items || []);
                    // Only set totalResults if this is the first page or a new query
                    if (page === 0) {
                        setTotalResults(data.tracks?.total || 0);
                    }
                }
            } catch (err) {
                if (!ignore) setSearchError(err.message);
            } finally {
                if (!ignore) setSearchLoading(false);
            }
        }
        fetchResults();
        return () => { ignore = true; };
    }, [query, page]);

    // Reset page to 0 if query changes
    useEffect(() => { setPage(0); }, [query]);

    // Helper to play a track and continue with the rest of the album
    async function playAlbumFromTrack(track) {
        try {
            const accessToken = getAccessTokenFromCookie();
            // Fetch album tracks
            const albumId = track.album?.id;
            if (!albumId) throw new Error('No album ID found');
            const albumRes = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!albumRes.ok) throw new Error('Failed to fetch album tracks');
            const albumData = await albumRes.json();
            const tracks = albumData.items || [];
            // Find index of selected track
            const startIdx = tracks.findIndex(t => t.id === track.id);
            if (startIdx === -1) throw new Error('Track not found in album');
            // Build play queue from selected track to end of album
            const uris = tracks.slice(startIdx).map(t => t.uri);
            // Start playback
            await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ uris })
            });
        } catch (err) {
            alert('Playback error: ' + err.message);
        }
    }

    return (
        <div className={styles.songResultsContents}>
            {searchLoading &&
                <>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[...Array(10)].map((_, i) => (
                            <li key={i} className={styles.loadingPlaceholder}>
                                {/* Placeholder content, e.g. skeleton loader */}
                                <div className={styles.searchResultImageContainer} />

                                <div style={{ width: '100%' }}>
                                    <div className={styles.trackName} />
                                    <div className={styles.artistName} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className={styles.paginationWrapper}>
                        <svg
                            width="36" height="36" viewBox="0 0 36 36" fill="none"
                            xmlns="http://www.w3.org/2000/svg" aria-label="Previous"
                            className={`${styles.paginationButton} ${page === 0 ? styles.paginationDisabled : ''}`}
                            onClick={() => page > 0 && setPage(page - 1)}
                        >
                            <polygon points="24,8 12,18 24,28" fill="currentColor" />
                        </svg>
                        <span className={styles.paginationPageInfo}>
                            Page {page + 1} of {Math.max(1, Math.ceil(totalResults / 10))}
                        </span>
                        <svg
                            width="36" height="36" viewBox="0 0 36 36" fill="none"
                            xmlns="http://www.w3.org/2000/svg" aria-label="Next"
                            className={`${styles.paginationButton} ${((page + 1) * 10 >= totalResults || searchResults.length === 0) ? styles.paginationDisabled : ''}`}
                            onClick={() => ((page + 1) * 10 < totalResults) && setPage(page + 1)}
                        >
                            <polygon points="12,8 24,18 12,28" fill="currentColor" />
                        </svg>
                    </div>
                </>
            }
            {searchError &&
                <ul>
                    <li>Error: {searchError}</li>
                </ul>
            }
            {/* <div style={{ color: 'red' }}>Error: {searchError}</div> */}
            {(!searchLoading && !searchError) && (
                <>
                    <ul >
                        {searchResults.map(track => (
                            <li key={track.id} onClick={() => playAlbumFromTrack(track)}>
                                <div className={styles.searchResultImageContainer}>
                                    <img src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '/fallback.webp'} alt="" width={40} height={40} />
                                </div>

                                <div style={{ width: '100%' }}>
                                    <div className={styles.trackName}>{track.name}</div>
                                    <div className={styles.artistName}>{track.artists?.map(a => a.name).join(', ')}</div>
                                </div>
                            </li>
                        ))}
                        {/* Render placeholders if less than 10 results */}
                        {Array.from({ length: 10 - searchResults.length }).map((_, i) => (
                            <li key={`placeholder-${i}`} className={styles.loadingPlaceholder} style={{ visibility: 'hidden' }}>
                                <div className={styles.searchResultImageContainer} />

                                <div style={{ width: '100%' }}>
                                    <div className={styles.trackName} />
                                    <div className={styles.artistName} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className={styles.paginationWrapper}>
                        <svg
                            width="36" height="36" viewBox="0 0 36 36" fill="none"
                            xmlns="http://www.w3.org/2000/svg" aria-label="Previous"
                            className={`${styles.paginationButton} ${page === 0 ? styles.paginationDisabled : ''}`}
                            onClick={() => page > 0 && setPage(page - 1)}
                        >
                            <polygon points="24,8 12,18 24,28" fill="currentColor" />
                        </svg>
                        <span className={styles.paginationPageInfo}>
                            Page {page + 1} of {Math.max(1, Math.ceil(totalResults / 10))}
                        </span>
                        <svg
                            width="36" height="36" viewBox="0 0 36 36" fill="none"
                            xmlns="http://www.w3.org/2000/svg" aria-label="Next"
                            className={`${styles.paginationButton} ${((page + 1) * 10 >= totalResults || searchResults.length === 0) ? styles.paginationDisabled : ''}`}
                            onClick={() => ((page + 1) * 10 < totalResults) && setPage(page + 1)}
                        >
                            <polygon points="12,8 24,18 12,28" fill="currentColor" />
                        </svg>
                    </div>
                </>
            )
            }
        </div >
    );
}
