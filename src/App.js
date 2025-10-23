import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Music from './pages/Music';
import Contact from './pages/Contact';
import Resume from './pages/Resume';
import './App.css';

function App() {
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

    // Initial position
    updateNavbarShine();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/music" element={<Music />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
