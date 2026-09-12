import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProfileSetup } from './pages/ProfileSetup';
import { SinglePlayer } from './pages/SinglePlayer';
import { Multiplayer } from './pages/Multiplayer';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { Lobby } from './pages/Lobby';
import { GamePlay } from './pages/GamePlay';
import { Results } from './pages/Results';
import { PassAndPlay } from './pages/PassAndPlay';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<ProfileSetup />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/multiplayer/create" element={<CreateRoom />} />
        <Route path="/multiplayer/join" element={<JoinRoom />} />
        <Route path="/join/:roomCode" element={<JoinRoom />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/play/single/:gameId" element={<GamePlay />} />
        <Route path="/play/multi/:roomCode" element={<GamePlay />} />
        <Route path="/play/local" element={<PassAndPlay />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '5rem' }}>🎮</div>
            <h2>Page Not Found</h2>
            <a href="#/" className="btn btn-primary btn-md">Go Home</a>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
