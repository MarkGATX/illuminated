// app/api/auth/callback/route.js
import { NextResponse } from 'next/server';
import { handleSpotifyCallback } from './actions';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Call your server action with the searchParams
  const result = await handleSpotifyCallback(searchParams);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 500 });
  }

  // return NextResponse.json({ success: true });
  // Redirect to your custom web player on success
  const host = request.headers.get('host');
  const protocol = host && host.startsWith('localhost') ? 'http' : 'http'; // adjust to 'https' if needed
  const webPlayerUrl = `${protocol}://${host}/webplayback`;
  return NextResponse.redirect(webPlayerUrl);
}
