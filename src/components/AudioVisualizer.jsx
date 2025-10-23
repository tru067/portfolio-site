import React, { useEffect, useRef, useState } from "react";

export default function AudioVisualizer({
  folders = [],
  tracks = [],
  currentTrackIndex = null,
  onTrackChange,
  onFolderChange,
  selectedFolder = null,
  width = "100%",
  height = 300,
  className = ""
}) {
  // Get current track info - handle null case
  const currentTrack = currentTrackIndex !== null && tracks[currentTrackIndex] ? tracks[currentTrackIndex] : { name: 'Select a Track', preset: 'default' };

  // Canvas and audio refs
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainRef = useRef(null);
  const bufferRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);
  const backgroundImageRef = useRef(null);

  // Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Preset configurations
  const presets = {
    default: {
      palette: ["#ff9966", "#ff5e62", "#ffd26f"],
      reactBass: 1.0,
      reactMid: 1.0,
      reactTreble: 1.0,
      fftSize: 2048,
      smoothing: 0.7,
      volume: 0.8,
      glow: true,
      bgShift: true
    },
    electronic: {
      palette: ["#00f5d4", "#f15bb5", "#fee440"],
      reactBass: 1.5,
      reactMid: 1.2,
      reactTreble: 1.0,
      fftSize: 2048,
      smoothing: 0.6,
      volume: 0.9,
      glow: true,
      bgShift: true
    },
    ambient: {
      palette: ["#aaf0ff", "#66c2ff", "#e6f7ff"],
      reactBass: 0.8,
      reactMid: 1.0,
      reactTreble: 1.3,
      fftSize: 1024,
      smoothing: 0.8,
      volume: 0.7,
      glow: false,
      bgShift: true
    },
    pop: {
      palette: ["#ff9966", "#ff5e62", "#ffd26f"],
      reactBass: 1.4,
      reactMid: 1.1,
      reactTreble: 1.2,
      fftSize: 2048,
      smoothing: 0.7,
      volume: 0.8,
      glow: true,
      bgShift: false
    },
    rock: {
      palette: ["#ff6b6b", "#4ecdc4", "#45b7d1"],
      reactBass: 1.3,
      reactMid: 1.2,
      reactTreble: 0.9,
      fftSize: 2048,
      smoothing: 0.6,
      volume: 0.9,
      glow: true,
      bgShift: false
    }
  };

  const config = presets[currentTrack.preset] || presets.default;

  // Ensure audio context exists and is running
  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio is not supported in this browser.");
      audioCtxRef.current = new AC();
    }

    const ctx = audioCtxRef.current;

    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = config.volume;
    }

    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = config.fftSize;
      analyserRef.current.smoothingTimeConstant = config.smoothing;
    }

    return ctx;
  };

  // Initialize audio context on user interaction
  const initializeAudioContext = async () => {
    if (!audioCtxRef.current) {
      await ensureAudio();
    }

    const ctx = audioCtxRef.current;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    return ctx;
  };

  // Load and decode audio file
  const loadAudio = async () => {
    const currentTrack = tracks[currentTrackIndex];
    if (!currentTrack) return;

    const ctx = await ensureAudio();

    const fileExtension = currentTrack.file.split('.').pop().toLowerCase();
    const isMP3 = fileExtension === 'mp3';

    const headers = {
      'Accept': isMP3 ? 'audio/mpeg' : 'audio/wav',
    };

    const response = await fetch(`/media/music/${currentTrack.file}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - File: ${currentTrack.file}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      bufferRef.current = audioBuffer;
    } catch (decodeError) {
      if (isMP3) {
        throw new Error(`MP3 decoding failed: ${currentTrack.file}. This could be due to browser compatibility or MP3 encoding issues.`);
      } else {
        throw new Error(`Audio decoding failed: ${currentTrack.file}. The file format may not be supported.`);
      }
    }
  };

  // Start playback
  const play = async () => {
    try {
      let buf = bufferRef.current;

      if (!buf) {
        await loadAudio();
        buf = bufferRef.current;
      }

      if (!buf) {
        throw new Error("No audio buffer available");
      }

      const ctx = await ensureAudio();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.stop(0);
          sourceRef.current.disconnect();
        } catch (e) {}
        sourceRef.current = null;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;
      sourceRef.current = src;

      try {
        try { gainRef.current.disconnect(); } catch (e) {}
        try { analyserRef.current.disconnect(); } catch (e) {}

        src.connect(gainRef.current);
        gainRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } catch (e) {
        try {
          src.connect(ctx.destination);
        } catch (fallbackError) {
          throw e;
        }
      }

      src.start(0);
      setIsPlaying(true);
      src.loop = true;
      src.onended = () => setIsPlaying(false);
      loop();

    } catch (error) {
      setIsPlaying(false);
      throw error;
    }
  };

  // Pause playback
  const pause = () => {
    try {
      if (sourceRef.current) {
        sourceRef.current.stop(0);
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      setIsPlaying(false);
      cancelAnimationFrame(rafRef.current);
    } catch (err) {
      console.error("Pause failed:", err);
    }
  };

  // Analysis helpers
  const getBands = (freq, sampleRate, fft) => {
    const binHz = sampleRate / fft;
    const sumRange = (lo, hi) => {
      const startIdx = Math.max(0, Math.floor(lo / binHz));
      const endIdx = Math.min(freq.length - 1, Math.ceil(hi / binHz));
      let s = 0; let c = 0;
      for (let i = startIdx; i <= endIdx; i++) { s += freq[i]; c++; }
      return c ? s / (c * 255) : 0;
    };
    const bass = sumRange(20, 150);
    const mid = sumRange(400, 2000);
    const treble = sumRange(4000, 12000);
    return { bass, mid, treble };
  };

  const getRMS = (time) => {
    let sum = 0;
    for (let i = 0; i < time.length; i++) {
      const v = (time[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / time.length);
  };



  // Render loop
  const loop = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const actx = audioCtxRef.current;
    if (!canvas || !analyser || !actx) return;

    const ctx2d = canvas.getContext("2d");

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio);

      const len = analyser.frequencyBinCount;
      const freq = new Uint8Array(len);
      const time = new Uint8Array(len);
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(time);
      const bands = getBands(freq, actx.sampleRate, analyser.fftSize);
      const energy = getRMS(time);

      // Dark grey background
      ctx2d.fillStyle = "#1a1a1a";
      ctx2d.fillRect(0, 0, w, h);

      // Apply color overlay that reacts to treble
      if (config.bgShift) {
        const t = Math.min(1, bands.treble * config.reactTreble * 1.5);
        ctx2d.fillStyle = `rgba(0,0,0,${0.3 - t * 0.2})`;
        ctx2d.fillRect(0, 0, w, h);
      }

      // Glow effect
      if (config.glow) {
        ctx2d.shadowBlur = 20;
        ctx2d.shadowColor = config.palette[1];
      } else {
        ctx2d.shadowBlur = 0;
      }

      // Waveform ribbons visualization
      const time2 = new Uint8Array(len);
      analyser.getByteTimeDomainData(time2);
      const thickness = 1 + Math.floor(4 * Math.min(1, energy * 3));
      ctx2d.lineWidth = thickness;

      const drawWave = (amp, color, yOffset = 0) => {
        ctx2d.strokeStyle = color;
        ctx2d.beginPath();
        for (let i = 0; i < len; i++) {
          const x = (i / (len - 1)) * w;
          const v = (time2[i] - 128) / 128;
          const y = h / 2 + yOffset + v * (h / 2) * amp;
          if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
        }
        ctx2d.stroke();
      };

      // Draw main waveform
      drawWave(0.7, config.palette[0], 0);

      // Draw secondary waveform that reacts to treble
      drawWave(
        Math.min(0.2 + bands.treble * config.reactTreble, 0.6),
        config.palette[1],
        Math.sin(Date.now()/350) * 10
      );
    };

    draw();
  };

  // React to parameter changes
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = config.volume;
    if (analyserRef.current) {
      analyserRef.current.fftSize = config.fftSize;
      analyserRef.current.smoothingTimeConstant = config.smoothing;
    }
  }, [config.volume, config.fftSize, config.smoothing]);

  // Handle track button clicks - play on first press, toggle for current track
  const handleTrackClick = async (index) => {
    const targetTrack = tracks[index];

    if (currentTrackIndex === index) {
      // Clicking the same track - toggle play/pause
      if (isPlaying) {
        pause();
      } else {
        await play();
      }
    } else {
      // Changing to a different track - stop current, switch track, then play new track
      if (isPlaying) {
        pause();
      }

      // Set loading state
      setIsLoading(true);

      // Update parent component state first
      onTrackChange && onTrackChange(index);

      // Wait for state update and load the new track
      if (targetTrack && targetTrack.file) {
        try {
          // Load the new track immediately using the target track data
          const ctx = await ensureAudio();

          const fileExtension = targetTrack.file.split('.').pop().toLowerCase();
          const isMP3 = fileExtension === 'mp3';
          const headers = { 'Accept': isMP3 ? 'audio/mpeg' : 'audio/wav' };

          const response = await fetch(`/media/music/${targetTrack.file}`, {
            method: 'GET',
            headers: headers,
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            // Update buffer with new track
            bufferRef.current = audioBuffer;

            // Now play the new track
            await playWithBuffer(audioBuffer);
          }
        } catch (error) {
          console.error("Failed to load new track:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
  };

  // Play with specific buffer (for track changes)
  const playWithBuffer = async (audioBuffer) => {
    try {
      const ctx = await ensureAudio();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.stop(0);
          sourceRef.current.disconnect();
        } catch (e) {}
        sourceRef.current = null;
      }

      const src = ctx.createBufferSource();
      src.buffer = audioBuffer;
      sourceRef.current = src;

      try {
        try { gainRef.current.disconnect(); } catch (e) {}
        try { analyserRef.current.disconnect(); } catch (e) {}

        src.connect(gainRef.current);
        gainRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } catch (e) {
        try {
          src.connect(ctx.destination);
        } catch (fallbackError) {
          throw e;
        }
      }

      src.start(0);
      setIsPlaying(true);
      src.loop = true;
      src.onended = () => setIsPlaying(false);
      loop();

    } catch (error) {
      setIsPlaying(false);
      throw error;
    }
  };

  // Initialize when component mounts or track changes
  useEffect(() => {
    // Only load audio if we're not currently playing and have a valid track
    if (currentTrack && currentTrack.file && !isPlaying) {
      loadAudio();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      try { sourceRef.current?.stop(0); } catch {}
    };
  }, [currentTrackIndex, tracks]);

  // Get current palette for styling
  const currentPalette = presets[currentTrack.preset]?.palette || presets.default.palette;

  const handleFolderClick = (folderName) => {
    onFolderChange && onFolderChange(folderName);
  };

  // Handle user interaction to initialize audio context
  const handleUserInteraction = async () => {
    await initializeAudioContext();
  };

  return (
    <div
      className={`cassette-visualizer ${className}`}
      style={{
        width,
        maxWidth: '100%',
        margin: '0 auto'
      }}
      onClick={handleUserInteraction}
    >
      {/* Cassette Tape Body */}
      <div className="cassette-body">
        {/* Category Selection */}
        {folders.length > 0 && (
          <div className="cassette-categories">
            <div className="category-label">playlists</div>
            <div className="category-buttons">
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  className={`category-button ${selectedFolder === folder.name ? 'active' : ''}`}
                  onClick={() => handleFolderClick(folder.name)}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Track Selection Buttons */}
        <div className="cassette-controls">
          {tracks.length > 0 ? (
            tracks.map((track, index) => (
              <button
                key={index}
                className={`track-button ${currentTrackIndex === index ? 'active' : ''} ${isLoading && currentTrackIndex === index ? 'loading' : ''}`}
                onClick={() => handleTrackClick(index)}
                disabled={isLoading}
                style={{
                  backgroundColor: currentTrackIndex === index && isPlaying ? '#ff4444' : currentTrackIndex === index ? '#cccccc' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: currentTrackIndex === index ? '#999999' : '#666',
                  color: currentTrackIndex === index ? '#000' : '#fff',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'wait' : 'pointer'
                }}
              >
                {isLoading && currentTrackIndex === index ? 'Loading...' : track.name}
              </button>
            ))
          ) : (
            <div className="no-tracks-message">
              {selectedFolder ? `No tracks in ${selectedFolder}` : 'Select a category to view tracks'}
            </div>
          )}
        </div>

        {/* Cassette Window (Visualizer) */}
        <div className="cassette-window">
          <div className="window-frame">
            <canvas
              ref={canvasRef}
              className="visualizer-screen"
              style={{
                height: height - 120, // Account for controls and categories
                maxHeight: '400px' // Limit max height for mobile
              }}
            />
          </div>
        </div>

        {/* Track Info */}
        <div className="cassette-info">
          <div className="track-name" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" }}>
            {isLoading ? 'Loading track...' : (isPlaying ? `NOW PLAYING: ${currentTrack.name}` : currentTrack.name)}
          </div>
        </div>
      </div>
    </div>
  );
}
