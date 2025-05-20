// app/api/auth/callback/actions.js
'use server';

import { cookies } from 'next/headers';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify_redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

// Define the server action
export async function handleSpotifyCallback(searchParams) {
  const code = searchParams.get('code');
    console.log('spotify auth code =  ', code)
  if (!code) {
    return { error: 'Authorization code missing', status: 400 };
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: spotify_redirect_uri,
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify API Error:', errorText);
      throw new Error('Failed to retrieve access token');
    }

    const data = await response.json();
    const { access_token, refresh_token, expires_in } = data;

    // Set the access token as a cookie
    const cookieStore = await cookies();
    cookieStore.set('access_token', access_token, { httpOnly: false, maxAge: expires_in });

    return { success: true, access_token };
  } catch (err) {
    console.error('Error getting tokens:', err);
    return { error: 'Failed to retrieve access token', details: err.message };
  }
}
