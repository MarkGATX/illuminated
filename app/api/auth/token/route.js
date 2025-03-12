import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  
  const cookie = await cookies()
  const accessToken = cookie.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ access_token: null });
  }

  return NextResponse.json({ access_token: accessToken });
}
