import React from 'react';

function Login() {
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

export default Login;
