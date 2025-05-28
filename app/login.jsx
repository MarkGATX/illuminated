import React from 'react';

export default function Login() {
  return (
    <>
      <header className="App-header">
        <button className="btn-spotify" onClick={() => window.location.href = "/api/auth/login"}>
          Login with Spotify
        </button>
      </header>
      <main>
        <h1>Welcome to Illuminated</h1>
        <p>This project was made to experiment with CoPilot AI as a programming partner.</p>
        <p>If you're a PREMIUM user of Spotify, you can login and access your music through the player.</p>
      </main>
    </>
  );
}