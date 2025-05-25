// 'use client';

// import { useSearchParams } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { handleSpotifyCallback } from '../callback/actions';

// export default function SpotifyCallback() {
//   const searchParams = useSearchParams();
//   const [status, setStatus] = useState(null);

//   useEffect(() => {
//     async function fetchAccessToken() {
//       const result = await handleSpotifyCallback(searchParams);

//       if (result.error) {
//         console.error(result.error);
//         setStatus('Error: ' + result.error);
//       } else {
//         console.log('Access Token:', result.access_token);
//         setStatus('Success! Access token retrieved.');
//       }
//     }

//     fetchAccessToken();
//   }, [searchParams]);

//   return (
//     <div>
//       <h1>Spotify Callback</h1>
//       <p>{status}</p>
//     </div>
//   );
// }
// app/callback/page.jsx

// app/api/auth/callback/route.js
import { NextResponse } from 'next/server';
import { handleSpotifyCallback } from './actions';

export async function GET(request) {
  const host = process.env.NEXT_PUBLIC_HOST || 'http://127.0.0.1:3000';
  const { searchParams } = new URL(request.url);

  // Call your server action with the searchParams
  const result = await handleSpotifyCallback(searchParams);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }

  // return NextResponse.json({ success: true });
    // Redirect to your custom web player on success
    // const webPlayerUrl = 'http://127.0.0.1:3000/webplayback'; // Replace with your actual web player URL
    const webPlayerUrl = `${host}/webplayback`;
    return NextResponse.redirect(webPlayerUrl);
}
