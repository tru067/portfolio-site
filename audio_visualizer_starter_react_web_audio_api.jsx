import React, { useEffect, useRef, useState } from "react";

// Deployable Audio Visualizer (Creative Edition)
// - MP3-ready via Web Audio decode (no <audio> autoplay issues)
// - Multiple visual modes reacting to different frequency bands (bass/mid/treble) + RMS
// - Particles, rotating rings, waveform ribbons, color palettes, band sensitivities
// - Tweakable UI for creative control

export default function AudioVisualizer() {
  // Canvas + audio graph refs
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainRef = useRef(null);
  const bufferRef = useRef(null); // Decoded AudioBuffer
  const sourceRef = useRef(null); // Current BufferSource
  const rafRef = useRef(null);

  // Transport state
  const [isPlaying, setIsPlaying] = useState(false);
  const [offset, setOffset] = useState(0); // seconds into buffer
  const [startedAt, setStartedAt] = useState(0); // ctx.currentTime when started

  // UI state
  const [scene, setScene] = useState("rings"); // rings | particles | waveform
  const [fftSize, setFftSize] = useState(2048);
  const [smoothing, setSmoothing] = useState(0.7);
  const [volume, setVolume] = useState(0.9);
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Creative controls
  const palettes = {
    Sunset: ["#ff9966", "#ff5e62", "#ffd26f"],
    Neon: ["#00f5d4", "#f15bb5", "#fee440"],
    Ice: ["#aaf0ff", "#66c2ff", "#e6f7ff"],
    Forest: ["#00a878", "#8ddf1f", "#2b9348"],
  };
  const [paletteName, setPaletteName] = useState("Neon");
  const [reactBass, setReactBass] = useState(1.2);
  const [reactMid, setReactMid] = useState(1.0);
  const [reactTreble, setReactTreble] = useState(1.0);
  const [particleCount, setParticleCount] = useState(180);
  const [rotation, setRotation] = useState(0.3); // rings spin speed
  const [glow, setGlow] = useState(true);
  const [bgShift, setBgShift] = useState(true); // background color shifts with treble

  // Particles state
  const particlesRef = useRef([]);

  // Ensure audio context / analyser / gain exist
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio is not supported in this browser.");
      audioCtxRef.current = new AC();
    }
    const ctx = audioCtxRef.current;
    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = volume;
    }
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
    } else {
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
    }
    // Connect gain -> analyser -> destination if not already
    try { gainRef.current.disconnect(); } catch {}
    gainRef.current.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);
    return ctx;
  };

  // File upload -> decode to AudioBuffer
  const onChooseFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stop();
    setErrorMsg("");
    setInfoMsg("Decoding...");
    setFileName(file.name);
    try {
      const ctx = ensureAudio();
      if (ctx.state === "suspended") await ctx.resume();
      const arr = await file.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      bufferRef.current = buf;
      setDuration(buf.duration);
      setOffset(0);
      setInfoMsg("Ready. Press Play.");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to decode audio: " + (err?.message || String(err)));
      bufferRef.current = null;
    }
  };

  // Start from current offset
  const play = async () => {
    try {
      setErrorMsg("");
      const buf = bufferRef.current;
      if (!buf) { setErrorMsg("Load a file first."); return; }
      const ctx = ensureAudio();
      if (ctx.state === "suspended") await ctx.resume();

      // Stop any previous source
      try { sourceRef.current?.stop(0); sourceRef.current?.disconnect(); } catch {}

      const src = ctx.createBufferSource();
      src.buffer = buf;
      sourceRef.current = src;
      src.connect(gainRef.current);

      const startAt = Math.max(0, Math.min(offset, buf.duration - 0.001));
      src.start(0, startAt);
      setStartedAt(ctx.currentTime - startAt);
      setIsPlaying(true);

      // When source ends, reset play state
      src.onended = () => {
        setIsPlaying(false);
        setOffset(0);
      };

      // (Re)seed particles on new play
      seedParticles();
      loop();
    } catch (err) {
      console.error(err);
      setErrorMsg("Play failed: " + (err?.message || String(err)));
    }
  };

  const pause = () => {
    const ctx = audioCtxRef.current;
    const src = sourceRef.current;
    if (!ctx || !src || !isPlaying) return;
    try { src.stop(0); } catch {}
    const now = ctx.currentTime;
    setOffset(now - startedAt);
    setIsPlaying(false);
  };

  const stop = () => {
    try { sourceRef.current?.stop(0); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    sourceRef.current = null;
    setIsPlaying(false);
    setOffset(0);
  };

  // ====== Analysis helpers ======
  const getBands = (freq, sampleRate, fft) => {
    const binHz = sampleRate / fft;
    const sumRange = (lo, hi) => {
      const startIdx = Math.max(0, Math.floor(lo / binHz));
      const endIdx = Math.min(freq.length - 1, Math.ceil(hi / binHz));
      let s = 0; let c = 0;
      for (let i = startIdx; i <= endIdx; i++) { s += freq[i]; c++; }
      return c ? s / (c * 255) : 0; // 0..1 average
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
    return Math.sqrt(sum / time.length); // 0..1 approx
  };

  // naive beat/energy detector (short history)
  const energyHistRef = useRef([]);
  const isPunch = (energy) => {
    const hist = energyHistRef.current;
    hist.push(energy);
    if (hist.length > 43) hist.shift(); // about ~0.7s at 60fps
    const avg = hist.reduce((a,b)=>a+b,0) / Math.max(1, hist.length);
    return energy > avg * 1.35; // spike threshold
  };

  // ====== Particles ======
  const seedParticles = () => {
    const parts = [];
    const w = canvasRef.current?.clientWidth || 800;
    const h = canvasRef.current?.clientHeight || 400;
    for (let i = 0; i < particleCount; i++) {
      parts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        life: Math.random() * 1000,
      });
    }
    particlesRef.current = parts;
  };

  // ====== Render loop ======
  const loop = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const actx = audioCtxRef.current;
    if (!canvas || !analyser || !actx) return;
    const ctx2d = canvas.getContext("2d");
    const palette = palettes[paletteName];

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
      const punch = isPunch(energy);

      // Background reacts to treble
      if (bgShift) {
        const t = Math.min(1, bands.treble * reactTreble * 1.5);
        ctx2d.fillStyle = `rgba(0,0,0,${1 - t * 0.2})`;
      } else {
        ctx2d.fillStyle = "rgba(0,0,0,1)";
      }
      ctx2d.fillRect(0, 0, w, h);

      // Common style
      if (glow) {
        ctx2d.shadowBlur = 20;
        ctx2d.shadowColor = palette[1];
      } else {
        ctx2d.shadowBlur = 0;
      }

      if (scene === "rings") {
        // Rotating rings: bass controls scale, mid controls thickness, treble controls color shift
        const rings = 6;
        const scale = 0.6 + bands.bass * reactBass * 0.6;
        const thickness = 2 + Math.floor(6 * (bands.mid * reactMid + 0.1));
        const hueShift = Math.floor(180 * bands.treble * reactTreble);
        const cx = w / 2, cy = h / 2;
        const baseR = Math.min(w, h) * 0.18 * scale;
        ctx2d.lineWidth = thickness;
        ctx2d.strokeStyle = palette[0];
        for (let i = 0; i < rings; i++) {
          ctx2d.save();
          ctx2d.translate(cx, cy);
          ctx2d.rotate(((Date.now()/1000) * rotation + i * 0.4));
          const r = baseR + i * (Math.min(w, h) * 0.07 * scale);
          ctx2d.beginPath();
          ctx2d.strokeStyle = shiftColor(palette[i % palette.length], hueShift);
          ctx2d.arc(0, 0, r, 0, Math.PI * 2);
          ctx2d.stroke();
          ctx2d.restore();
        }
      } else if (scene === "particles") {
        // Particles: bass -> speed/size, mid -> trail length, treble -> hue flicker
        const speed = 0.5 + bands.bass * reactBass * 6;
        const hueShift = Math.floor(240 * bands.treble * reactTreble);
        const parts = particlesRef.current;
        const trail = Math.floor(6 + 20 * bands.mid * reactMid);
        for (let k = 0; k < parts.length; k++) {
          const p = parts[k];
          p.vx += (Math.random()-0.5) * 0.2 * bands.bass;
          p.vy += (Math.random()-0.5) * 0.2 * bands.bass;
          p.x += p.vx * speed;
          p.y += p.vy * speed;
          p.size = 1.5 + 4 * (bands.mid * reactMid + energy * 0.5);
          // wrap
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

          ctx2d.fillStyle = shiftColor(palette[(k%palette.length)], hueShift);
          for (let t = 0; t < trail; t++) {
            const tx = p.x - p.vx * t;
            const ty = p.y - p.vy * t;
            ctx2d.globalAlpha = 1 - t / trail;
            ctx2d.beginPath();
            ctx2d.arc(tx, ty, p.size, 0, Math.PI * 2);
            ctx2d.fill();
          }
          ctx2d.globalAlpha = 1;
        }
        // punch flash
        if (punch) {
          ctx2d.fillStyle = `${palette[2]}22`;
          ctx2d.fillRect(0, 0, w, h);
        }
      } else {
        // waveform ribbons: RMS controls thickness, treble controls secondary ribbon amplitude
        const len = analyser.frequencyBinCount;
        const time2 = new Uint8Array(len);
        analyser.getByteTimeDomainData(time2);
        const thickness = 1 + Math.floor(4 * Math.min(1, energy * 3));
        ctx2d.lineWidth = thickness;

        const drawWave = (amp, color, yOffset=0) => {
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
        drawWave(0.7, palette[0], 0);
        drawWave(Math.min(0.2 + bands.treble * reactTreble, 0.6), palette[1], Math.sin(Date.now()/350) * 10);
      }
    };

    draw();
  };

  // React to parameter changes
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
    if (analyserRef.current) {
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
    }
  }, [volume, fftSize, smoothing]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Helpers
  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const currentTime = () => {
    const ctx = audioCtxRef.current;
    if (isPlaying && ctx) return ctx.currentTime - startedAt;
    return offset;
  };

  const shiftColor = (hex, shift=0) => {
    // tiny hue shift helper, works on #rrggbb
    const toHSL = (r,g,b)=>{
      r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2; if(max===min){h=s=0;} else {const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;} h/=6;} return [h,s,l];};
    const toRGB = (h,s,l)=>{let r,g,b; if(s===0){r=g=b=l;} else {const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p;}; const q=l<0.5?l*(1+s):l+s-l*s; const p=2*l-q; r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);} return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];};
    const toRGBInt = (hex)=>{const v=parseInt(hex.slice(1),16); return [(v>>16)&255,(v>>8)&255,v&255];};
    const [r,g,b]=toRGBInt(hex); let [h,s,l]=toHSL(r,g,b); h=(h + (shift/360))%1; const [R,G,B]=toRGB(h,s,l); return `rgb(${R},${G},${B})`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto grid gap-4">
        <h1 className="text-2xl font-semibold">Audio Visualizer – Creative</h1>
        <p className="opacity-80 text-sm">Upload an MP3, then press Play. Multiple scenes react to bass/mid/treble and energy.</p>

        {errorMsg && (<div className="bg-red-600/20 border border-red-500/40 px-3 py-2 rounded-xl text-sm"><strong>Error:</strong> {errorMsg}</div>)}
        {infoMsg && (<div className="bg-amber-500/20 border border-amber-400/40 px-3 py-2 rounded-xl text-sm">{infoMsg}</div>)}

        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3 py-2 rounded-2xl bg-white text-black cursor-pointer">
            <input type="file" accept="audio/*" className="hidden" onChange={onChooseFile} />
            Choose audio file
          </label>

          <button className="px-3 py-2 rounded-2xl bg-white text-black" onClick={play}>Play</button>
          <button className="px-3 py-2 rounded-2xl bg-white text-black" onClick={pause}>Pause</button>
          <button className="px-3 py-2 rounded-2xl bg-white text-black" onClick={stop}>Stop</button>

          <div className="ml-auto flex items-center gap-3 text-sm flex-wrap">
            <span className="opacity-70">Scene:</span>
            <select className="bg-white text-black px-2 py-1 rounded-xl" value={scene} onChange={(e)=>setScene(e.target.value)}>
              <option value="rings">Rings</option>
              <option value="particles">Particles</option>
              <option value="waveform">Waveform ribbons</option>
            </select>
            <span className="opacity-70">Palette:</span>
            <select className="bg-white text-black px-2 py-1 rounded-xl" value={paletteName} onChange={(e)=>setPaletteName(e.target.value)}>
              {Object.keys(palettes).map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 bg-white/5 p-4 rounded-2xl">
          <div>
            <label className="block text-xs mb-1">FFT size</label>
            <input type="range" min={256} max={32768} step={256} value={fftSize} onChange={(e)=>setFftSize(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">{fftSize}</div>
          </div>
          <div>
            <label className="block text-xs mb-1">Smoothing</label>
            <input type="range" min={0} max={0.95} step={0.01} value={smoothing} onChange={(e)=>setSmoothing(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">{smoothing.toFixed(2)}</div>
          </div>
          <div>
            <label className="block text-xs mb-1">Volume</label>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e)=>setVolume(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">{Math.round(volume*100)}%</div>
          </div>
          <div>
            <label className="block text-xs mb-1">Bass react</label>
            <input type="range" min={0} max={3} step={0.05} value={reactBass} onChange={(e)=>setReactBass(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">x{reactBass.toFixed(2)}</div>
          </div>
          <div>
            <label className="block text-xs mb-1">Mid react</label>
            <input type="range" min={0} max={3} step={0.05} value={reactMid} onChange={(e)=>setReactMid(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">x{reactMid.toFixed(2)}</div>
          </div>
          <div>
            <label className="block text-xs mb-1">Treble react</label>
            <input type="range" min={0} max={3} step={0.05} value={reactTreble} onChange={(e)=>setReactTreble(Number(e.target.value))} className="w-full" />
            <div className="text-xs opacity-70">x{reactTreble.toFixed(2)}</div>
          </div>
          {scene === 'particles' && (
            <div className="col-span-2">
              <label className="block text-xs mb-1">Particles</label>
              <input type="range" min={50} max={600} step={10} value={particleCount} onChange={(e)=>{setParticleCount(Number(e.target.value)); seedParticles();}} className="w-full" />
              <div className="text-xs opacity-70">{particleCount}</div>
            </div>
          )}
          {scene === 'rings' && (
            <div>
              <label className="block text-xs mb-1">Rotation</label>
              <input type="range" min={0} max={2} step={0.01} value={rotation} onChange={(e)=>setRotation(Number(e.target.value))} className="w-full" />
              <div className="text-xs opacity-70">{rotation.toFixed(2)}</div>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs col-span-2">
            <label className="flex items-center gap-2"><input type="checkbox" checked={glow} onChange={(e)=>setGlow(e.target.checked)} /> Glow</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={bgShift} onChange={(e)=>setBgShift(e.target.checked)} /> BG reacts to treble</label>
          </div>
          <div className="text-xs opacity-80 flex flex-col gap-1 col-span-2">
            <div><span className="opacity-70">File:</span> {fileName || "None"}</div>
            <div><span className="opacity-70">Time:</span> {fmt(currentTime())} / {fmt(duration)}</div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="relative bg-white/5" style={{ height: 460 }}>
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        <details className="opacity-80">
          <summary className="cursor-pointer">Diagnostics</summary>
          <ul className="text-sm list-disc pl-5 mt-2">
            <li>Plays decoded AudioBuffer (no &lt;audio&gt; element), so autoplay policies are not an issue.</li>
            <li>Requires HTTPS or localhost for best compatibility.</li>
            <li>Frequency band mapping: bass 20–150 Hz, mid 400–2000 Hz, treble 4–12 kHz.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
