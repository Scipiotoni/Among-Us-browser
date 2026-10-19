// Tiny synthesized sound effects (no audio files needed).
const Sfx = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('sus_muted') === '1'; } catch (e) {}
  const ensure = () => {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol = 0.2, freq = 1200) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }
  return {
    unlock: ensure,
    toggle() { muted = !muted; try { localStorage.setItem('sus_muted', muted ? '1' : '0'); } catch (e) {} return muted; },
    get muted() { return muted; },
    click: () => tone(660, 0.06, 'square', 0.05),
    good: () => { tone(660, 0.1, 'triangle', 0.12); tone(990, 0.15, 'triangle', 0.12, 0, 0.08); },
    bad: () => tone(180, 0.25, 'sawtooth', 0.08, -60),
    task: () => { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0, 0.09); tone(784, 0.25, 'triangle', 0.14, 0, 0.18); },
    kill: () => { noise(0.35, 0.35, 900); tone(120, 0.4, 'sawtooth', 0.15, -80); },
    vent: () => { noise(0.25, 0.25, 400); tone(90, 0.2, 'square', 0.06, 40); },
    alarm: () => { for (let i = 0; i < 3; i++) { tone(880, 0.18, 'square', 0.08, 0, i * 0.4); tone(660, 0.18, 'square', 0.08, 0, i * 0.4 + 0.2); } },
    meeting: () => { for (let i = 0; i < 4; i++) tone(i % 2 ? 520 : 780, 0.2, 'square', 0.09, 0, i * 0.22); },
    sabotage: () => { tone(300, 0.5, 'sawtooth', 0.08, 300); tone(300, 0.5, 'sawtooth', 0.08, 300, 0.6); },
    vote: () => tone(440, 0.12, 'triangle', 0.1, 220),
    eject: () => tone(400, 1.4, 'sine', 0.1, -350),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.13, 0, i * 0.15)),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'triangle', 0.13, 0, i * 0.18)),
    shield: () => { tone(1200, 0.3, 'sine', 0.1, -600); tone(800, 0.3, 'sine', 0.08, 400, 0.05); },
    door: () => { noise(0.2, 0.2, 300); tone(70, 0.25, 'square', 0.08); },
    poof: () => { noise(0.3, 0.2, 2500); tone(900, 0.3, 'sine', 0.06, -700); },
    beep: () => tone(1000, 0.05, 'square', 0.05),
  };
})();
