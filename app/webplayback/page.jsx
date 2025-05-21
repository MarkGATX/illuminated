'use client'
import styles from './webplayback.module.css';
import React, { useState, useEffect, useRef } from 'react';
import { useExtractColors } from 'react-extract-colors';
import Color from 'colorjs.io';
import SearchBar from '../components/SearchBar';


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
  const animationRef = useRef();
  const albumArtUrl = currentTrack?.album?.images[0]?.url || '/fallback.webp';
  const { colors } = useExtractColors(albumArtUrl, {
    maxColors: 10,
    format: 'hex',
    maxSize: 200,
    orderBy: 'vibrance'
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
    console.log('fetchWithRefresh: URL:', url);
    console.log('fetchWithRefresh: Access Token:', accessToken);
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Debug response status
    console.log('fetchWithRefresh: Response Status:', response.status);

    if (response.status === 401) {
      // Try to refresh the token
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
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
    console.log(response)
    return response;
  }

  useEffect(() => {

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token'))
        ?.split('=')[1];
      console.log(document.cookie)
      if (!accessToken) {
        console.error("No access token found");
        window.location.href = "/";
        return;
      }


      const newPlayer = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      setPlayer(newPlayer);
      console.log('Player set:', newPlayer);


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
        console.log('Device ID has gone offline', device_id);
      });

      newPlayer.addListener('player_state_changed', (state => {
        // Only update if the track is valid
        if (!state || !state.track_window || !state.track_window.current_track) return;
        setCurrentTrack(state.track_window.current_track);
        setPaused(state.paused);
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
      const response = await fetchWithRefresh(
        `https://api.spotify.com/v1/me/tracks/contains?ids=${currentTrack.id}`
      );
      if (response && response.ok) {
        const data = await response.json();
        setIsLiked(data[0]);
      } else {
        setIsLiked(false);
      }
    };
    checkIfLiked();
  }, [currentTrack]);



  // Initialize oklchColorsArray when colors change
  useEffect(() => {
    if (colors && colors.length > 0) {
      const arr = getOklchColorArray(colors);
      console.log('oklchColorsArray:', arr);
      setOklchColorsArray(arr);
    }
  }, [colors]);

  // Fisher-Yates shuffle
  function fisherYatesShuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    let isMounted = true;
    // Animate color changes every 3 seconds
    const interval = setInterval(() => {
      if (!colors || colors.length === 0) return;
      // Fisher-Yates shuffle for animation effect
      const shuffledColors = fisherYatesShuffle(colors);
      const arr = getOklchColorArray(shuffledColors);
      if (isMounted) {
        setOklchColorsArray(arr);
      }
    }, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [colors]);


  return (
    <>
      <main>
        <header>
          <button
            style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, padding: '.5em' }}
            onClick={() => {
              document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              window.location.href = '/';
            }}
          >
            Logout
          </button>

          {deviceId ? <p>Illuminated Web Player</p> : <p>Connecting...</p>}
        </header>
        <div className={styles.mainWrapper}>
          {/* Color Visualizer */}
          <div className={`${styles.visualizerContainer} ${styles.left}`}>
            {getFixedLengthColors(oklchColorsArray, 10).map((color, i) => (
              <div
                key={i}
                className={styles.visualizerBar}
                style={{
                  background: color,
                  boxShadow: `${color} 0 0 50px`,
                  width: `50px`,
                  height: `calc(100dvh / 10)`,
                  minWidth: '8px',
                  maxWidth: '100%',
                  transition: 'all 3s linear'
                }}
              />
            ))}
          </div>
          <div className={`${styles.visualizerContainer} ${styles.right}`}>
            {getFixedLengthColors(oklchColorsArray, 10).map((color, i) => (
              <div
                key={i}
                className={styles.visualizerBar}
                style={{
                  background: color,
                  boxShadow: `${color} 0 0 50px`,
                  width: `50px`,
                  height: `calc(100dvh / 10)`,
                  minWidth: '8px',
                  maxWidth: '100%',
                  transition: 'all 3s linear'
                }}
              />
            ))}
          </div>
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

          <div className={styles.trackInfoContainer}>
            <div className={styles.trackName}>{
              currentTrack?.name || "Unknown Track"
            }</div>

            <div className={styles.artistName}>{
              currentTrack?.artists[0]?.name || "Unknown Artist"
            }</div>
          </div>

          <div className={styles.playButtonsContainer}>
            <button className="btn-spotify" onClick={async () => {
              if (player) {
                await player.previousTrack();
              }
            }} >
              &lt;&lt;
            </button>

            <button className="btn-spotify" onClick={async () => {
              if (player) {
                await player.togglePlay();
              }
            }} >
              {!is_active || is_paused ? "PLAY" : "PAUSE"}
            </button>

            <button className="btn-spotify" onClick={async () => {
              if (player) {
                await player.nextTrack();
              }
            }} >
              &gt;&gt;
            </button>



          </div>
          <SearchBar />
        </div>
      </main>
    </>
  );
}