import React, { useState, useEffect } from 'react';
import { fetchWithRefresh } from '../../utils/spotifyFetch';
import styles from './playlistSearchResults.module.css';

export default function PlaylistSearchResults({ query, onPlaylistSelect }) {
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
                const offset = page * 10;
                const res = await fetchWithRefresh(
                    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=10&offset=${offset}`
                );
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();
                if (!ignore) {
                    setSearchResults(data.playlists?.items || []);
                    // Only set totalResults if this is the first page or a new query
                    if (page === 0) {
                        setTotalResults(data.playlists?.total || 0);
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

    return (
        <div className={styles.playlistResultsContents}>
            {searchLoading &&
                <>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[...Array(10)].map((_, i) => (
                            <li key={i} className={styles.loadingPlaceholder}>
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

            {(!searchLoading && !searchError) && (
                <>
                    <ul >
                        {/* Sort results to ensure empty slots are at the end */}
                        {[...searchResults].sort((a, b) => {
                            if (a && !b) return -1;
                            if (!a && b) return 1;
                            return 0;
                        }).map((playlist, index) => (
                            playlist ? (
                                <li key={playlist?.id} onClick={() => onPlaylistSelect && onPlaylistSelect(playlist)}>
                                    <div className={styles.searchResultImageContainer}>
                                        <img src={playlist?.images?.[0]?.url || '/fallback.webp'} alt="" width={40} height={40} />
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div className={styles.trackName}>{playlist?.name}</div>
                                        <div className={styles.artistName}>{playlist.owner?.display_name}</div>
                                    </div>
                                </li>
                            ) : (
                                <li key={`empty-${index}`} style={{ visibility: 'hidden' }}></li>
                            )
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
            )}
        </div>
    );
}
