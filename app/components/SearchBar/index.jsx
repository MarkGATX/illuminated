import React, { useState } from 'react';
import styles from './searchBar.module.css';

// A reusable search input component with results display
export default function SearchBar () {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const getAccessTokenFromCookie = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token'))
            ?.split('=')[1];
    };

    const handleSearch = async (searchQuery) => {
        if (!searchQuery) return [];
        setSearchLoading(true);
        setSearchError(null);
        setSearchResults([]);
        try {
            const accessToken = getAccessTokenFromCookie();
            const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=10`, {
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
        handleSearch(query);
    };

    return (
        <div className={styles.searchContainer} >
            <form onSubmit={handleSubmit} className={`${styles.searchBar} `} style={{ display: 'flex', alignItems: 'center', gap: '0.5em', marginBottom: '1em' }}>

                <input
                    type="text"
                    value={query}
                    placeholder='Search...'
                    onChange={handleInputChange}
                    className={styles.searchInput}
                    style={{ flex: 1, padding: '0.5em', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" className={`${styles.searchButton}`}>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--search-icon-color, #888)', fontSize: '1.2em',  }}>
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
                <div className={styles.searchResults} style={{ marginBottom: '1em' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {searchResults.map(track => (
                            <li key={track.id} >
                                <div className={styles.searchResultImageContainer}>
                                    <img src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '/fallback.webp'} alt="" width={40} height={40} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{track.name}</div>
                                    <div style={{ fontSize: '0.9em', color: '#888' }}>{track.artists?.map(a => a.name).join(', ')}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


