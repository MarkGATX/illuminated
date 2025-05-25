'use client'

import React, { useState, useEffect } from 'react';
import Login from './login';
import WebPlayback from './webplayback/page';
import { redirect } from 'next/dist/server/api-utils';

async function getToken() {
  const redirectURI = process.env.SPOTIFY_REDIRECT_URI
  // const res = await fetch('http://localhost:3000/api/auth/token');
  // const res = await fetch('http://127.0.0.1:3000/api/auth/token');
    const res = await fetch(redirectURI);

  return res.json();
}

export default function Home() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      const res = await getToken();
      setToken(res.access_token);
      setLoading(false);
    }
    fetchToken();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
    
        {token ? <WebPlayback token={token} /> : <Login />}
        

    </>
  );
}