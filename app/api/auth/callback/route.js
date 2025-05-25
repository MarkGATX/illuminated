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
