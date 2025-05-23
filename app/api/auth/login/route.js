import { NextResponse } from 'next/server';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const generateRandomString = (length) => {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export async function GET() {
  const state = generateRandomString(16);
  const scope = 'streaming user-read-email user-read-private user-library-modify user-library-read user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: spotify_redirect_uri,
    state: state,
  });

  const authorizationUrl = `https://accounts.spotify.com/authorize?${params}`;

  // Debug logging
  console.log('SPOTIFY_CLIENT_ID:', spotify_client_id);
  console.log('SPOTIFY_REDIRECT_URI:', spotify_redirect_uri);
  console.log('SPOTIFY_SCOPE:', scope);
  console.log('SPOTIFY_AUTH_URL:', authorizationUrl);

  return NextResponse.redirect(authorizationUrl);
}
