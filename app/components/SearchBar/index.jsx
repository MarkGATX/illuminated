import React, { useState } from 'react';
import styles from './searchBar.module.css';

// A reusable search input component with results display
export default function SearchBar({ onTrackSelect }) {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [page, setPage] = useState(0); // pagination state

    const getAccessTokenFromCookie = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token'))
            ?.split('=')[1];
    };

    const handleSearch = async (searchQuery, pageNum = 0) => {
        if (!searchQuery) return [];
        setSearchLoading(true);
        setSearchError(null);
        setSearchResults([]);
        try {
            const accessToken = getAccessTokenFromCookie();
            const offset = pageNum * 10;
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=10&offset=${offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setSearchResults(data.tracks?.items || []);
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        handleSearch(query, 0);
    };

    return (
        <div className={styles.searchContainer} >
            <form onSubmit={handleSubmit} className={`${styles.searchBar} `} >

                <input
                    type="text"
                    value={query}
                    placeholder='Search...'
                    onChange={handleInputChange}
                    className={styles.searchInput}
                // style={{ flex: 1, padding: '0.5em', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" className={`${styles.searchButton}`}>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--search-icon-color, #888)', fontSize: '1.2em', }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
                            <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </span>
                </button>
            </form>
            {searchLoading && <div style={{ color: '#888' }}>Searching...</div>}
            {searchError && <div style={{ color: 'red' }}>Error: {searchError}</div>}
            {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                    <h2 className={styles.songResultsTitle}>Songs</h2>
                    <div className={styles.songResultsContents}>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {searchResults.map(track => (
                                <li key={track.id} onClick={() => onTrackSelect && onTrackSelect({ ...track, searchResults })}>
                                    <div className={styles.searchResultImageContainer}>
                                        <img src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '/fallback.webp'} alt="" width={40} height={40} />
                                    </div>
                                    <div>
                                        <div className={styles.trackName}>{track.name}</div>
                                        <div className={styles.artistName}>{track.artists?.map(a => a.name).join(', ')}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className={styles.paginationWrapper}>
                            <svg
                                width="36" height="36" viewBox="0 0 36 36" fill="none"
                                xmlns="http://www.w3.org/2000/svg" aria-label="Previous"
                                className={styles.paginationButton + ' ' + (page === 0 ? styles.paginationDisabled : '')}
                                onClick={() => {
                                    if (page > 0) setPage(p => { const newPage = p - 1; handleSearch(query, newPage); return newPage; });
                                }}
                            >
                                <polygon points="24,8 12,18 24,28" fill="currentColor" />
                            </svg>
                            <span className={styles.paginationPageInfo}>Page {page + 1} / 3</span>
                            <svg
                                width="36" height="36" viewBox="0 0 36 36" fill="none"
                                xmlns="http://www.w3.org/2000/svg" aria-label="Next"
                                className={styles.paginationButton + ' ' + ((searchResults.length < 10 || page >= 2) ? styles.paginationDisabled : '')}
                                onClick={() => {
                                    if (searchResults.length === 10 && page < 2) setPage(p => { const newPage = p + 1; handleSearch(query, newPage); return newPage; });
                                }}
                            >
                                <polygon points="12,8 24,18 12,28" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


