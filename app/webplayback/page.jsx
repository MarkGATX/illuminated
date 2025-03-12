'use client'

import React, { useState, useEffect } from 'react';

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

function WebPlayback() {
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [current_track, setTrack] = useState(track);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);


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
        return;
      }


      const newPlayer = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      setPlayer(newPlayer);

      newPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      newPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      newPlayer.addListener('player_state_changed', ( state => {

        if (!state) {
            return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        newPlayer.getCurrentState().then( state => { 
            (!state)? setActive(false) : setActive(true) 
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

  return (
    <>
      <div className="container">
        <div className="main-wrapper">
          {deviceId ? <p>Connected Device ID: {deviceId}</p> : <p>Connecting...</p>}
          <img src={current_track.album.images[0].url} 
                     className="now-playing__cover" alt="" />

                <div className="now-playing__side">
                    <div className="now-playing__name">{
                                  current_track.name
                                  }</div>

                    <div className="now-playing__artist">{
                                  current_track.artists[0].name
                                  }</div>
                </div>
                <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
      &lt;&lt;
</button>

<button className="btn-spotify" onClick={() => { player.togglePlay() }} >
     { is_paused ? "PLAY" : "PAUSE" }
</button>

<button className="btn-spotify" onClick={() => { player.nextTrack() }} >
      &gt;&gt;
</button>
        </div>
      </div>
    </>
  );
}

export default WebPlayback;
