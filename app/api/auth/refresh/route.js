import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST() {
    const cookieStore = await cookies();
    const refresh_token = cookieStore.get('refresh_token')?.value;

    if (!refresh_token) {
        // Redirect to root if no refresh token
        return NextResponse.redirect('/', 302);
    }

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    });

    if (!response.ok) {
        // Redirect to root if refresh fails
        return NextResponse.redirect('/', 302);
    }

    const data = await response.json();
    console.log('Refreshed access token:', data.access_token);
    cookieStore.set('access_token', data.access_token, { httpOnly: false, maxAge: data.expires_in });

    // Optionally update refresh_token if Spotify returns a new one
    if (data.refresh_token) {
        cookieStore.set('refresh_token', data.refresh_token, { httpOnly: false });
    }

    return NextResponse.json({ access_token: data.access_token });
}