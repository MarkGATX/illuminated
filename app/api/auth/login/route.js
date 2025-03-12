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
  const scope = 'streaming user-read-email user-read-private';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: spotify_redirect_uri,
    state: state,
  });

  const authorizationUrl = `https://accounts.spotify.com/authorize?${params}`;

  return NextResponse.redirect(authorizationUrl);
}
