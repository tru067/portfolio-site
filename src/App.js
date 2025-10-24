import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Music from './pages/Music';
import Contact from './pages/Contact';
import Resume from './pages/Resume';
import './App.css';

function Miniplayer({ currentTrack, isPlaying, onPlayPause, onClose }) {
  if (!currentTrack) return null;

  return (
    <div className="miniplayer">
      <div className="miniplayer-content">
        <div className="miniplayer-info">
          <span className="miniplayer-title">NOW PLAYING</span>
          <span className="miniplayer-track">{currentTrack.name}</span>
        </div>
        <div className="miniplayer-controls">
          <button
            className="miniplayer-btn"
            onClick={onPlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            className="miniplayer-btn miniplayer-close"
            onClick={onClose}
          >
            ❌
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);

  useEffect(() => {
    // Animated navbar shine effect based on scroll
    const updateNavbarShine = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const navbar = document.querySelector('.navbar');

      if (navbar) {
        const shinePosition = -100 + (scrollPercent * 2); // Shine moves from -100% to 100%
        navbar.style.setProperty('--shine-position', `${Math.max(-100, Math.min(100, shinePosition))}%`);
      }
    };

    // Matrix cursor effect
    const createMatrixCursor = () => {
      const cursor = document.createElement('div');
      cursor.className = 'matrix-cursor';
      document.body.appendChild(cursor);

      const updateCursor = (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      };

      document.addEventListener('mousemove', updateCursor);

      return () => {
        document.removeEventListener('mousemove', updateCursor);
        document.body.removeChild(cursor);
      };
    };

    // Throttled scroll handler for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateNavbarShine();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Initialize cursor and navbar
    const cleanupCursor = createMatrixCursor();
    updateNavbarShine();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cleanupCursor();
    };
  }, []);

  const handleTrackChange = (track) => {
    setCurrentTrack(track);
    setIsTrackPlaying(true); // Auto-play when track changes
  };

  const handlePlayPause = () => {
    setIsTrackPlaying(!isTrackPlaying);
  };

  const handleCloseMiniplayer = () => {
    setCurrentTrack(null);
    setIsTrackPlaying(false);
  };

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music onTrackChange={handleTrackChange} />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Miniplayer
        currentTrack={currentTrack}
        isPlaying={isTrackPlaying}
        onPlayPause={handlePlayPause}
        onClose={handleCloseMiniplayer}
      />
    </div>
  );
}

export default App;
