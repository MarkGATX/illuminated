// import React, { useState } from 'react';
// import styles from './searchBar.module.css';
// import SongSearchResults from '../SongSearchResults';

// // A reusable search input component with results display
// export default function SearchBar({ onTrackSelect }) {
//     const [query, setQuery] = useState('');
//     const [searchResults, setSearchResults] = useState([]);
//     const [searchLoading, setSearchLoading] = useState(false);
//     const [searchError, setSearchError] = useState(null);
//     const [page, setPage] = useState(0); // pagination state

//     const getAccessTokenFromCookie = () => {
//         return document.cookie
//             .split('; ')
//             .find(row => row.startsWith('access_token'))
//             ?.split('=')[1];
//     };

//     const handleSearch = async (searchQuery, pageNum = 0) => {
//         if (!searchQuery) return [];
//         setSearchLoading(true);
//         setSearchError(null);
//         setSearchResults([]);
//         try {
//             const accessToken = getAccessTokenFromCookie();
//             const offset = pageNum * 10;
//             const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=10&offset=${offset}`,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${accessToken}`,
//                     },
//                 });
//             if (!res.ok) throw new Error('Search failed');
//             const data = await res.json();
//             setSearchResults(data.tracks?.items || []);
//         } catch (err) {
//             setSearchError(err.message);
//         } finally {
//             setSearchLoading(false);
//         }
//     };

//     const handleInputChange = (e) => {
//         setQuery(e.target.value);
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         setPage(0);
//         handleSearch(query, 0);
//     };

//     return (
//         <div className={styles.searchContainer} >
//             <form onSubmit={handleSubmit} className={`${styles.searchBar} `} >

//                 <input
//                     type="text"
//                     value={query}
//                     placeholder='Search...'
//                     onChange={handleInputChange}
//                     className={styles.searchInput}
//                 // style={{ flex: 1, padding: '0.5em', borderRadius: '4px', border: '1px solid #ccc' }}
//                 />
//                 <button type="submit" className={`${styles.searchButton}`}>
//                     <span style={{ display: 'flex', alignItems: 'center', color: 'var(--search-icon-color, #888)', fontSize: '1.2em', }}>
//                         <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//                             <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
//                             <line x1="14.2" y1="14.2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//                         </svg>
//                     </span>
//                 </button>
//             </form>
//             <div className={styles.searchResults}>

//                 {searchLoading && <div style={{ color: '#888' }}>Searching...</div>}
//                 {searchError && <div style={{ color: 'red' }}>Error: {searchError}</div>}
//                 {searchResults.length > 0 && (
//                     <>
//                         <h2 className={styles.songResultsTitle}>Songs</h2>
//                         <SongSearchResults onTrackSelect={onTrackSelect} searchResults={searchResults} page={page} setPage={setPage}  />
//                     </>

//                 )}
//             </div>
//         </div>
//     );
// };

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
                            onPlaylistSelect={onTrackSelect}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

