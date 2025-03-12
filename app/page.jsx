'use client'

import React, { useState, useEffect } from 'react';
import WebPlayback from './webplayback';
import Login from './login';

async function getToken() {
  const res = await fetch('http://localhost:3000/api/auth/token');
  return res.json();
}

export default function Home() {
  const { access_token: token } = getToken();

  return (
    <>
      {token ? <WebPlayback token={token} /> : <Login />}
    </>
  );
}
