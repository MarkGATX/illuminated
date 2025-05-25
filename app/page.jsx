'use client'

import React, { useState, useEffect } from 'react';
import Login from './login';
import WebPlayback from './webplayback/page';

const host = process.env.NEXT_PUBLIC_HOST || 'http://127.0.0.1:3000';

async function getToken() {
  const res = await fetch(`${host}/api/auth/token`);
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