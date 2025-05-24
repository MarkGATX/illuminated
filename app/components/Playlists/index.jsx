import React, { useEffect, useState } from 'react';
import styles from './playlists.module.css';

export default function Playlists({ playPlaylist }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const listRef = React.useRef(null);

    useEffect(() => {
        const getAccessTokenFromCookie = () => {
            return document.cookie
                .split('; ')
                .find(row => row.startsWith('access_token'))
                ?.split('=')[1];
        };
        const fetchPlaylists = async () => {
            setLoading(true);
            setError(null);
            try {
                const accessToken = getAccessTokenFromCookie();
                const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!res.ok) throw new Error('Failed to fetch playlists');
                const data = await res.json();
                console.log('playlists: ', data);
                setPlaylists(data.items || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, []);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const updateScroll = () => {
            setCanScrollLeft(list.scrollLeft > 0);
            setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
        };
        updateScroll();
        list.addEventListener('scroll', updateScroll);
        window.addEventListener('resize', updateScroll);
        return () => {
            list.removeEventListener('scroll', updateScroll);
            window.removeEventListener('resize', updateScroll);
        };
    }, [playlists]);

        // Handler to play a playlist by passing a special object
    const handlePlaylistSelect = (playlist) => {
        if (playlist && playlist.uri) {
            // Pass a special object to onTrackSelect with a playlistUri property
            playPlaylist({ playlistUri: playlist.uri });
        }
    };

    if (loading) return <div>Loading playlists...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className={styles.playlistsRow}>
            <h2 className={styles.playlistsTitle}>My Playlists</h2>
            <svg
                className={styles.arrowSvg}
                width="42" height="42" viewBox="0 0 28 28" fill="#f5e1e1"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Scroll left"
                style={{ cursor: canScrollLeft ? 'pointer' : 'not-allowed', opacity: canScrollLeft ? 1 : 0.4 }}
                // tabIndex={canScrollLeft ? 0 : -1}
                // role="button"
                // stroke="#f5e1e1"
                strokeWidth="2"
                onClick={() => {
                    if (!canScrollLeft) return;
                    const list = listRef.current;
                    if (list) list.scrollBy({ left: -300, behavior: 'smooth' });
                }}
            // onKeyDown={e => {
            //     if (!canScrollLeft) return;
            //     if (e.key === 'Enter' || e.key === ' ') {
            //         const list = listRef.current;
            //         if (list) list.scrollBy({ left: -300, behavior: 'smooth' });
            //     }
            // }}
            >
                <polygon points="18,6 10,14 18,22" strokeWidth="2" />
            </svg>
            <ul id="playlists-list" className={styles.playlistsList} ref={listRef}>
                {playlists.map(playlist => (
                    <li
                        key={playlist.id}
                        className={styles.playlistCard}
                        onClick={() => handlePlaylistSelect(playlist)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.playlistImageContainer}>
                            <img
                                src={playlist?.images?.[0]?.url || '/fallback.webp'}
                                alt={playlist.name}
                                className={styles.playlistImage}
                            />
                        </div>
                        <div className={styles.playlistName}>
                            {playlist.name}</div>
                    </li>
                ))}
            </ul>
            <svg
                className={styles.arrowSvg}
                width="42" height="42" viewBox="0 0 28 28" fill="#f5e1e1"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Scroll right"
                style={{ cursor: canScrollRight ? 'pointer' : 'not-allowed', stroke: '#f5e1e1', fill: '#f5e1e1', opacity: canScrollRight ? 1 : 0.4 }}
                // tabIndex={canScrollRight ? 0 : -1}
                // role="button"
                // stroke="#f5e1e1"
                strokeWidth="2"
                onClick={() => {
                    if (!canScrollRight) return;
                    const list = listRef.current;
                    if (list) list.scrollBy({ left: 300, behavior: 'smooth' });
                }}
            // onKeyDown={e => {
            //     if (!canScrollRight) return;
            //     if (e.key === 'Enter' || e.key === ' ') {
            //         const list = listRef.current;
            //         if (list) list.scrollBy({ left: 300, behavior: 'smooth' });
            //     }
            // }}
            >
                <polygon points="10,6 18,14 10,22" strokeWidth="2" />
            </svg>
        </div>
    );
}

