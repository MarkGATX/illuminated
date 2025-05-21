import React from 'react';

export default function Login() {
  return (
    <main>
      <header className="App-header">
        <button className="btn-spotify" onClick={() => window.location.href = "/api/auth/login"}>
          Login with Spotify
        </button>
      </header>
    </main>
  );
}