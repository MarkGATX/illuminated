'use client'
import styles from './webplayback.module.css';
import React, { useState, useEffect, useRef } from 'react';
import { useExtractColors } from 'react-extract-colors';
import Color from 'colorjs.io';
import SearchBar from '../components/SearchBar';
import Playlists from '../components/Playlists';
import ColorVisualizer from '../components/colorVisualizer';


const track = {
  name: "",
  album: {
    images: [
      { url: "" }
    ]
  },
  artists: [
    { name: "" }
  ]
}

export default function WebPlayback() {
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(track);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [oklchColorsArray, setOklchColorsArray] = useState([]);
  const [previousTracks, setPreviousTracks] = useState([]);
  const [nextTracks, setNextTracks] = useState([]);
  const [isPremium, setIsPremium] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const animationRef = useRef();
  const albumArtUrl = currentTrack?.album?.images[0]?.url || '/fallback.webp';
  const { colors } = useExtractColors(albumArtUrl, {
    maxColors: 10,
    format: 'hex',
    maxSize: 200,
    orderBy: 'dominance'
  });
  // Remove local oklchColors, use state instead
  // const oklchColors = Array(2)
  //   .fill()
  //   .flatMap(() => colors.map(hex => new Color(hex).to("oklch")))

  const getAccessTokenFromCookie = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token'))
      ?.split('=')[1];
  };

  // Helper to repeat or sample colors to exactly n items
  function getOklchColorArray(hexColors) {
    if (!hexColors || hexColors.length === 0) return [];
    const oklchColors = hexColors.map(hex => new Color(hex).to("oklch").toString());
    return oklchColors;
  }

  // Helper to get an array of exactly n colors, repeating or sampling as needed
  function getFixedLengthColors(colors, n = 10) {
    if (!colors || colors.length === 0) return Array(n).fill('oklch(0 0 0)');
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(colors[i % colors.length]);
    }
    return arr;
  }

  const likeButton = async () => {
    if (!currentTrack?.id) return;
    let response;
    if (isLiked) {
      // Unlike (remove from library)
      response = await fetchWithRefresh(
        `https://api.spotify.com/v1/me/tracks?ids=${currentTrack.id}`,
        { method: 'DELETE' }
      );
      if (response && response.ok) {
        setIsLiked(false);

      } else {
        alert('Failed to unlike track.');
      }
    } else {
      // Like (add to library)
      response = await fetchWithRefresh(
        `https://api.spotify.com/v1/me/tracks?ids=${currentTrack.id}`,
        { method: 'PUT' }
      );
      if (response && response.ok) {
        setIsLiked(true);

      } else {
        alert('Failed to like track.');
      }
    }
  }

  const fetchWithRefresh = async (url, options = {}) => {
    let accessToken = getAccessTokenFromCookie();
    // Debug logging

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Debug response status


    if (response.status === 401) {
      // Try to refresh the token
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        // Update the cookie so future requests use the new token
        document.cookie = `access_token=${accessToken}; path=/;`;
        // Retry the original request
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } else {
        // Redirect to login or home if refresh fails
        window.location.href = '/';
        return null;
      }
    }

    return response;
  }

  useEffect(() => {

    if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (!window.Spotify || !window.Spotify.Player) {
        console.error("Spotify SDK failed to load or is undefined.");
        alert("Failed to initialize Spotify Player. Please refresh the page or check your network connection.");
        return;
      }

      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token'))
        ?.split('=')[1];
      if (!accessToken) {
        console.error("No access token found", accessToken);
        // window.location.href = "/";
        return;
      }

      const newPlayer = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: async cb => {
          // Always get the latest token from cookies, and refresh if needed
          let accessToken = getAccessTokenFromCookie();
          // Optionally, you could check expiry and call refresh endpoint here
          if (!accessToken) {
            // Try to refresh
            try {
              const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
              const refreshData = await refreshRes.json();
              if (refreshData.access_token) {
                accessToken = refreshData.access_token;
              }
            } catch (e) {
              // If refresh fails, redirect to login
              window.location.href = '/';
              return;
            }
          }
          cb(accessToken);
        },
        volume: 0.5
      });

      setPlayer(newPlayer);


      newPlayer.addListener('ready', async ({ device_id }) => {
        setDeviceId(device_id);
        // Transfer playback
        await fetchWithRefresh('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: true,
          }),
        });

      });

      newPlayer.addListener('not_ready', ({ device_id }) => {
      });

      newPlayer.addListener('player_state_changed', (state => {
        // Only update if the track is valid
        if (!state || !state.track_window || !state.track_window.current_track) return;
        setCurrentTrack(state.track_window.current_track);
        setPaused(state.paused);
        setPreviousTracks(state.track_window.previous_tracks || []);
        setNextTracks(state.track_window.next_tracks || []);
        newPlayer.getCurrentState().then(state => {
          setActive(!!state);
        });
      }));

      newPlayer.connect();
    };


    return () => {
      // Cleanup on unmount
      if (player) {
        player.disconnect();
      }
      window.onSpotifyWebPlaybackSDKReady = null;
    };
  }, []);


  useEffect(() => {
    const checkIfLiked = async () => {
      if (!currentTrack?.id) {
        setIsLiked(false);
        return;
      }
      try {
        const response = await fetchWithRefresh(
          `https://api.spotify.com/v1/me/tracks/contains?ids=${currentTrack.id}`
        );
        if (response && response.ok) {
          const data = await response.json();
          setIsLiked(Array.isArray(data) && data.length > 0 ? data[0] : false);
        }
      } catch (error) {
        console.error('Error checking if track is liked:', error);
        setIsLiked(false);
      }
    };
    checkIfLiked();
  }, [currentTrack]);



  // Initialize oklchColorsArray when colors change
  useEffect(() => {
    if (colors && colors.length > 0) {
      const arr = getOklchColorArray(colors);
      setOklchColorsArray(arr);
    }
  }, [colors]);

  // Check Premium status on mount
  useEffect(() => {
    const checkPremium = async () => {
      const accessToken = getAccessTokenFromCookie();
      if (!accessToken) {
        setIsPremium(false);
        console.error("No access token found for premium check");
        return;
      }
      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // debugger;
        if (!res.ok) {
          setIsPremium(false);
          return;
        }
        const data = await res.json();
        // debugger;
        setIsPremium(data.product === 'premium');
      } catch {
        setIsPremium(false);
      }
    };
    checkPremium();
  }, []);


  // If not premium, show message and don't render app
  if (isPremium === false) {
    return (
      <main className={styles.mainWrapper}>
        <h2 style={{ textAlign: 'center', marginTop: '4em' }}>You must be a Spotify Premium member to access this application.</h2>
        <button onClick={() => window.location.href = 'https://www.spotify.com/premium/'}>Upgrade to Premium</button>
        <button onClick={() => window.location.href = '/'}>Go Home</button>
      </main>
    );
  }

  // Play a track or playlist on the current device
  const playTrack = async (item) => {
    if (!deviceId || (!item?.track && !item?.playlistUri && !item?.uri)) {
      alert('No device or track/playlist selected!');
      return;
    }
    // If item is a playlist (from playlist search)
    if (item.playlistUri) {
      await fetchWithRefresh(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: item.playlistUri
        })
      });
      return;
    }
    // If item has albumUri and track, play album context starting from track
    if (item.albumUri && item.track) {
      await fetchWithRefresh(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: item.albumUri,
          offset: { uri: item.track.uri }
        })
      });
      return;
    }
    // Otherwise, play all search result URIs as a queue
    if (window.lastSearchResults && Array.isArray(window.lastSearchResults)) {
      const uris = window.lastSearchResults.map(t => t.uri);
      const offset = uris.indexOf(item.uri);
      await fetchWithRefresh(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris,
          offset: { position: offset >= 0 ? offset : 0 },
        })
      });
      return;
    }
    // Fallback: play just the single track
    await fetchWithRefresh(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: [item.uri || (item.track && item.track.uri)] })
    });
  };

  // Shuffle playback on the current device (toggle)
  const shufflePlayback = async () => {
    if (!deviceId) {
      alert('No device connected!');
      return;
    }
    const newShuffleState = !isShuffling;
    await fetchWithRefresh(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}&device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    setIsShuffling(newShuffleState);
  };

  // Optionally, sync shuffle state with Spotify on mount/device change
  useEffect(() => {
    const fetchShuffleState = async () => {
      if (!deviceId) return;
      const res = await fetchWithRefresh(`https://api.spotify.com/v1/me/player`);
      if (res.ok) {
        const data = await res.json();
        setIsShuffling(!!data.shuffle_state);
      }
    };
    fetchShuffleState();
  }, [deviceId]);


  return (
    <>
      <main>
        <header>
          <button className={styles.logoutButton}
            style={{ position: 'absolute', top: 20, right: 100, zIndex: 10, padding: '.5em' }}
            onClick={() => {
              document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.href = '/';
            }}
          >
            Logout
          </button>

          {deviceId ? <Playlists playPlaylist={playTrack} /> : <p>Connecting...</p>}
        </header>
        <div className={styles.mainWrapper}>
          {/* Color Visualizer */}
          <ColorVisualizer colors={oklchColorsArray} />

          <div className={styles.albumArtContainer}>
            <img
              src={albumArtUrl}
              alt="Album Art"
              crossOrigin="anonymous"
            />
            {/* Like/Unlike button */}
            <p className={styles.likeButton} onClick={likeButton}
              disabled={!currentTrack?.id}
            >
              {isLiked ? '❤️' : '🤍'}
            </p>

          </div>

          <div className={styles.currentTrackInfoContainer}>
            <div className={styles.trackName}>{
              currentTrack?.name || "Unknown Track"
            }</div>

            <div className={styles.artistName}>{
              currentTrack?.artists[0]?.name || "Unknown Artist"
            } - {currentTrack?.album?.name || ""}</div>
          </div>

          <div className={styles.playButtonsContainer}>
            

            {previousTracks.length === 0 ? (
              <div className={styles.previousTrackInfo}>
                <div className={styles.trackImageContainer}>
                  <img
                    src='/fallback.webp'
                    alt="Album Art"

                  />
                </div>
                <div className={styles.trackInfoContainer}>
                  <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>No track</h3>
                  <p></p>
                </div>

              </div>
            ) : (
              <div className={styles.previousTrackInfo} key={previousTracks[previousTracks.length - 1]?.id || 0} >
                <div className={styles.trackImageContainer}>
                  <img
                    src={previousTracks[previousTracks.length - 1]?.album?.images?.[0]?.url || '/fallback.webp'}
                    alt="Album Art"

                  />
                </div>
                <div className={styles.trackInfoContainer}>
                  <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{`${previousTracks[previousTracks.length - 1]?.name}`}</h3>
                  <p>{`${previousTracks[previousTracks.length - 1]?.artists?.[0]?.name}`}</p>
                </div>
              </div>
            )}
            {/* Previous Track: Two left chevrons */}
            <svg
              width="36" height="36" viewBox="0 0 36 36" fill="none"
              xmlns="http://www.w3.org/2000/svg" aria-label="Previous"
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                if (player) {
                  await player.previousTrack();
                }
              }}
            >
              <polygon points="20,8 12,18 20,28" fill="currentColor" />
              <polygon points="28,8 20,18 28,28" fill="currentColor" />
            </svg>
            {/* Play/Pause SVGs (unchanged logic, color updated) */}
            {!is_active || is_paused ? (
              <svg
                width="64" height="64" viewBox="0 0 54 54" fill="none"
                xmlns="http://www.w3.org/2000/svg" aria-label="Play"
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  if (player) {
                    await player.togglePlay();
                  }
                }}
              >
                <polygon points="15,9 45,27 15,45" fill="currentColor" />
              </svg>
            ) : (
              <svg
                width="64" height="64" viewBox="0 0 54 54" fill="none"
                xmlns="http://www.w3.org/2000/svg" aria-label="Pause"
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  if (player) {
                    await player.togglePlay();
                  }
                }}
              >
                <rect x="19.5" y="15" width="6" height="24" rx="1.5" fill="currentColor" />
                <rect x="31.5" y="15" width="6" height="24" rx="1.5" fill="currentColor" />
              </svg>
            )}
            {/* Shuffle Button */}
            <svg
              width="48" height="48" viewBox="0 0 100 100" fill="none"
              xmlns="http://www.w3.org/2000/svg" aria-label="Shuffle"
              style={{              
                background: isShuffling ? '#f5f5f5' : undefined,
                borderRadius: '6px',
                boxShadow: isShuffling ? '0 0 0 2px oklch(0.9259 0.022 17.56)' : undefined,
              }}
              onClick={shufflePlayback}
              title={isShuffling ? 'Disable Shuffle' : 'Enable Shuffle'}
            >
              <path d="M83.745,69.516l-8.181,5.666V67.08c0,0-9.253,0-10.93,0c-15.551,0-29.989-27.566-41.66-27.566H8.069v-6.542h14.906  c18.125,0,29.063,27.65,41.66,27.65c1.76,0,10.93,0,10.93,0V52.52l8.181,5.666l8.186,5.665L83.745,69.516z"
                fill={isShuffling ? 'oklch(0.1324 0.0541 260.04)' : 'oklch(0.9259 0.022 17.56)'} />
              <path d="M50.619,45.877c0.375,0.396,0.749,0.794,1.123,1.19c4.344-4.354,8.521-7.69,12.894-7.69c1.76,0,10.93,0,10.93,0v8.103  l8.181-5.666l8.186-5.666l-8.186-5.666l-8.181-5.665v8.102c0,0-9.253,0-10.93,0c-6.048,0-11.926,4.172-17.539,9.269  C48.298,43.419,49.472,44.659,50.619,45.877z"
                fill={isShuffling ? 'oklch(0.1324 0.0541 260.04)' : 'oklch(0.9259 0.022 17.56)'} />
              <path d="M37.986,54.719c-0.633-0.626-1.276-1.261-1.923-1.894c-4.649,4.337-9.037,7.661-13.088,7.661H8.069v6.541h14.906  c6.979,0,12.889-4.103,18.243-9.145C40.123,56.824,39.044,55.763,37.986,54.719z"
                fill={isShuffling ? 'oklch(0.1324 0.0541 260.04)' : 'oklch(0.9259 0.022 17.56)'} />
            </svg>
            {/* Next Track: Two right chevrons */}
            <svg
              width="36" height="36" viewBox="0 0 36 36" fill="none"
              xmlns="http://www.w3.org/2000/svg" aria-label="Next"
              style={{ cursor: 'pointer' }}
              onClick={async () => {
                if (player) {
                  await player.nextTrack();
                }
              }}
            >
              <polygon points="16,8 24,18 16,28" fill="currentColor" />
              <polygon points="8,8 16,18 8,28" fill="currentColor" />
            </svg>




            {nextTracks.length === 0 ? (
              <div key={nextTracks[0]?.id || 0} className={styles.nextTrackInfo}>
                <div>
                  <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>No track</h3>
                  <p></p>
                </div>
                <div className={styles.trackImageContainer}>
                  <img
                    src='/fallback.webp'
                    alt="Album Art"

                  />
                </div>
              </div>
            ) : (
              <div key={nextTracks[0]?.id || 0} className={styles.nextTrackInfo}>
                <div className={`${styles.trackInfoContainer} ${styles.next}`}>
                  <h3 style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{`${nextTracks[0]?.name}`}</h3>
                  <p>{`${nextTracks[0]?.artists?.[0]?.name}`}</p>
                </div>
                <div className={styles.trackImageContainer}>
                  <img
                    src={nextTracks[0]?.album?.images?.[0]?.url || '/fallback.webp'}
                    alt="Album Art"

                  />
                </div>
              </div>
            )}


          </div>



          <SearchBar onTrackSelect={playTrack} />
        </div>
      </main>
    </>
  );
}