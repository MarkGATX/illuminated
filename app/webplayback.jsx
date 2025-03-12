// 'use client'

// import React, { useState, useEffect } from 'react';

// function WebPlayback() {
//   const [player, setPlayer] = useState(null);
//   const [deviceId, setDeviceId] = useState(null);

//   useEffect(() => {
//     const script = document.createElement("script");
//     script.src = "https://sdk.scdn.co/spotify-player.js";
//     script.async = true;

//     document.body.appendChild(script);

//     window.onSpotifyWebPlaybackSDKReady = () => {
//       const accessToken = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('access_token='))
//         ?.split('=')[1];

//       if (!accessToken) {
//         console.error("No access token found");
//         return;
//       }

//       const newPlayer = new window.Spotify.Player({
//         name: 'Web Playback SDK',
//         getOAuthToken: cb => { cb(accessToken); },
//         volume: 0.5
//       });

//       setPlayer(newPlayer);

//       newPlayer.addListener('ready', ({ device_id }) => {
//         console.log('Ready with Device ID', device_id);
//         setDeviceId(device_id);
//       });

//       newPlayer.addListener('not_ready', ({ device_id }) => {
//         console.log('Device ID has gone offline', device_id);
//       });

//       newPlayer.connect();
//     };

//     return () => {
//       // Cleanup on unmount
//       if (player) {
//         player.disconnect();
//       }
//       window.onSpotifyWebPlaybackSDKReady = null;
//     };
//   }, []);

//   return (
//     <>
//       <div className="container">
//         <div className="main-wrapper">
//           {deviceId ? <p>Connected Device ID: {deviceId}</p> : <p>Connecting...</p>}
//         </div>
//       </div>
//     </>
//   );
// }

// export default WebPlayback;
