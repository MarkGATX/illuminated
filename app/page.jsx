'use client'

import React, { useState, useEffect } from 'react';
import Login from './login';
import WebPlayback from './webplayback/page';
import { fetchWithRefresh } from './utils/spotifyFetch';

const host = process.env.NEXT_PUBLIC_HOST || 'http://127.0.0.1:3000';

export default function Home() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      const res = await fetchWithRefresh(`${host}/api/auth/token`);
      if (res && res.ok) {
        const data = await res.json();
        setToken(data.access_token);
      }
      setLoading(false);
    }
    fetchToken();
  }, []);

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : (
        token ? <WebPlayback token={token} /> : <Login />
      )}
    </>
  );
}