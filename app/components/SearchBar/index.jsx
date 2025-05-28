

import React, { useState } from 'react';
import styles from './searchBar.module.css';
import SongSearchResults from '../SongSearchResults';
import PlaylistSearchResults from '../PlaylistSearchResults';

export default function SearchBar({ onTrackSelect }) {
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');

    const handleInputChange = (e) => setQuery(e.target.value);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmittedQuery(query); // Only update on submit
    };

    // Handler to play a playlist by passing a special object
    const handlePlaylistSelect = (playlist) => {
        if (playlist && playlist.uri) {
            // Pass a special object to onTrackSelect with a playlistUri property
            onTrackSelect({ playlistUri: playlist.uri });
        }
    };

    return (
        <div className={styles.searchContainer}>
            <form onSubmit={handleSubmit} className={styles.searchBar}>
                <input
                    type="text"
                    value={query}
                    placeholder="Search..."
                    onChange={handleInputChange}
                    className={styles.searchInput}
                />
                <button type="submit" className={styles.searchButton}>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--search-icon-color, #888)', fontSize: '1.2em', }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
                            <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </span>
                </button>
            </form>
            {submittedQuery && (
                <div className={styles.searchResults}>
                    <div className={styles.songResultsContainer}>
                        <h2 className={styles.songResultsTitle}>Songs</h2>
                        <SongSearchResults
                            query={submittedQuery}
                            onTrackSelect={onTrackSelect}
                        />
                    </div>
                    <div className={styles.playlistResultsContainer}>
                        <h2 className={styles.playlistResultsTitle}>Playlists</h2>
                        <PlaylistSearchResults
                            query={submittedQuery}
                            onPlaylistSelect={handlePlaylistSelect}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

