// Cartoon kill animations, unlocked by the "★ Kill Animations" box prize. Each scene is drawn on a
// 640x360 canvas from p = 0..1; the killer stands on the left, the victim on the right.
const KillAnim = (() => {
  const W = 640, H = 360, FLOOR = 292, KX = 180, VX = 455, S = 2.1;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const easeIn = (x) => x * x, easeOut = (x) => 1 - (1 - x) * (1 - x);

  function stage(c, tint) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tint || '#1b1030'); g.addColorStop(1, '#07060d');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, FLOOR, W, H - FLOOR);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, FLOOR, W, 3);
  }
  const who = (c, prof, x, y, dir, t, o = {}) => Draw.character(c, x, y, { ...prof, dir, scale: S * (o.scale || 1), phase: t, moving: o.moving, alpha: o.alpha, noPet: true });
  function body(c, prof, x, y, o = {}) {
    c.save(); c.translate(x, y); c.scale(S * (o.sx || 1), S * (o.sy || 1));
    Draw.body(c, 0, 0, prof.color, o.alpha);
    c.restore();
  }
  function stars(c, x, y, t) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + i * 2.1;
      Draw.star(c, x + Math.cos(a) * 34, y + Math.sin(a) * 10, 8, '#ffd32a');
    }
  }
  function puff(c, x, y, r, alpha, color = '200,200,210') {
    c.fillStyle = `rgba(${color},${alpha})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  function word(c, text, x, y, k, color = '#ffd32a') {
    if (k <= 0) return;
    c.save(); c.translate(x, y); c.rotate(-0.12); c.scale(0.6 + easeOut(Math.min(1, k * 3)) * 0.6, 0.6 + easeOut(Math.min(1, k * 3)) * 0.6);
    c.font = 'bold 54px "Trebuchet MS", sans-serif'; c.textAlign = 'center';
    c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(text, 0, 0);
    c.fillStyle = color; c.fillText(text, 0, 0); c.restore();
  }

  const SCENES = {
    zap: { name: 'Laser Zap', draw(c, p, t, k, v) {
      stage(c, '#0d1a33');
      who(c, k, KX, FLOOR, 1, t);
      const charge = seg(p, 0.05, 0.25);
      if (p < 0.45) { c.fillStyle = `rgba(80,220,255,${charge * 0.8})`; c.beginPath(); c.arc(KX + 55, FLOOR - 60, 6 + charge * 14, 0, 7); c.fill(); }
      if (p >= 0.25 && p < 0.47) {
        c.strokeStyle = '#7ef9ff'; c.lineWidth = 6; c.shadowColor = '#7ef9ff'; c.shadowBlur = 20;
        c.beginPath(); c.moveTo(KX + 55, FLOOR - 60);
        for (let x = KX + 75; x < VX - 20; x += 22) c.lineTo(x, FLOOR - 60 + (Math.random() - 0.5) * 26);
        c.lineTo(VX - 10, FLOOR - 60); c.stroke(); c.shadowBlur = 0;
      }
      if (p < 0.47) {
        const shake = p > 0.25 ? (Math.random() - 0.5) * 10 : 0;
        who(c, v, VX + shake, FLOOR, -1, t);
        if (p > 0.25) { c.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`; c.beginPath(); c.arc(VX, FLOOR - 63, 55, 0, 7); c.fill(); }
      } else {
        body(c, v, VX, FLOOR);
        const s = seg(p, 0.47, 1);
        for (let i = 0; i < 4; i++) puff(c, VX - 30 + i * 20, FLOOR - 30 - s * 90 - i * 10, 10 + s * 18, 0.5 * (1 - s));
      }
    } },
    anvil: { name: 'Anvil Drop', draw(c, p, t, k, v) {
      stage(c);
      who(c, k, KX, FLOOR, 1, t);
      const fall = easeIn(seg(p, 0.12, 0.36));
      const y = -90 + fall * (FLOOR - 70 + 90);
      if (p < 0.36) {
        who(c, v, VX, FLOOR, -1, t);
        c.fillStyle = `rgba(0,0,0,${0.15 + fall * 0.35})`; c.beginPath(); c.ellipse(VX, FLOOR + 4, 30 + fall * 30, 8, 0, 0, 7); c.fill();
      } else {
        body(c, v, VX, FLOOR + 6, { sy: 0.45, sx: 1.3 });
        const d = seg(p, 0.36, 0.6);
        for (let i = 0; i < 5; i++) puff(c, VX - 70 + i * 35, FLOOR - 10 - d * 20, 10 + d * 16, 0.6 * (1 - d));
        stars(c, VX, FLOOR - 110, t);
        word(c, 'CLANG!', VX - 20, 90, seg(p, 0.36, 0.5));
      }
      c.save(); c.translate(VX, Math.min(y, FLOOR - 70));
      c.fillStyle = '#3d4450'; c.strokeStyle = '#111'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-70, -30); c.lineTo(60, -30); c.quadraticCurveTo(90, -30, 95, -12); c.lineTo(40, -10); c.lineTo(30, 20); c.lineTo(55, 20); c.lineTo(55, 40); c.lineTo(-55, 40); c.lineTo(-55, 20); c.lineTo(-30, 20); c.lineTo(-40, -10); c.lineTo(-70, -10); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(-60, -26, 110, 6);
      c.restore();
    } },
    blackhole: { name: 'Black Hole', draw(c, p, t, k, v) {
      stage(c, '#0a0420');
      who(c, k, KX, FLOOR, 1, t);
      const grow = easeOut(seg(p, 0.12, 0.32)) * (1 - easeIn(seg(p, 0.75, 0.9)));
      const hx = VX + 20, hy = FLOOR - 160;
      if (grow > 0) {
        for (let i = 3; i >= 0; i--) {
          c.strokeStyle = `rgba(${[162, 255, 116, 255][i]},${[155, 120, 185, 255][i]},${[254, 220, 255, 255][i]},0.7)`; c.lineWidth = 5;
          c.beginPath(); c.ellipse(hx, hy, grow * (80 + i * 14), grow * (22 + i * 4), t * (1 + i * 0.4), 0, 7); c.stroke();
        }
        c.fillStyle = '#000'; c.beginPath(); c.arc(hx, hy, grow * 46, 0, 7); c.fill();
      }
      const suck = easeIn(seg(p, 0.3, 0.72));
      if (suck < 1) {
        c.save();
        const x = VX + (hx - VX) * suck, y = FLOOR + (hy + 40 - FLOOR) * suck;
        c.translate(x, y - 50 * suck); c.rotate(suck * 9);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S * (1 - suck), phase: t, noPet: true });
        c.restore();
      }
      if (p > 0.88) {
        const d = seg(p, 0.88, 1);
        body(c, v, VX, FLOOR, { alpha: d });
        word(c, 'POP!', VX, 120, d, '#c59bff');
      }
    } },
    rocket: { name: 'Rocket Launch', draw(c, p, t, k, v) {
      stage(c, '#10183a');
      who(c, k, KX, FLOOR, 1, t);
      const rise = easeIn(seg(p, 0.28, 0.62));
      const y = FLOOR - rise * 520;
      if (p < 0.62) {
        c.save(); c.translate(VX, y);
        if (p > 0.2) {
          for (let i = 0; i < 6; i++) puff(c, (Math.random() - 0.5) * 30, 30 + i * 18, 10 + i * 3, 0.5 - i * 0.07, '255,170,60');
        }
        c.fillStyle = '#dfe6e9'; c.strokeStyle = '#111'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-18, 20); c.lineTo(-18, -20); c.quadraticCurveTo(0, -60, 18, -20); c.lineTo(18, 20); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#e74c3c'; c.beginPath(); c.moveTo(-18, 10); c.lineTo(-34, 30); c.lineTo(-18, 26); c.moveTo(18, 10); c.lineTo(34, 30); c.lineTo(18, 26); c.fill();
        c.restore();
        who(c, v, VX, y - 34, -1, t);
      }
      const boom = seg(p, 0.6, 0.85);
      if (boom > 0 && boom < 1) {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          c.fillStyle = ['#ffd32a', '#ff4757', '#7bed9f', '#70a1ff'][i % 4];
          c.beginPath(); c.arc(VX + Math.cos(a) * boom * 140, 70 + Math.sin(a) * boom * 100, 6 * (1 - boom) + 2, 0, 7); c.fill();
        }
        word(c, 'BOOM!', VX, 80, boom);
      }
      if (p > 0.78) {
        const f = easeIn(seg(p, 0.78, 0.95));
        body(c, v, VX, -40 + f * (FLOOR + 40));
      }
    } },
    freeze: { name: 'Freeze Ray', draw(c, p, t, k, v) {
      stage(c, '#0b2236');
      who(c, k, KX, FLOOR, 1, t);
      if (p > 0.12 && p < 0.4) {
        for (let i = 0; i < 9; i++) {
          const q = ((t * 3 + i / 9) % 1);
          Draw.star(c, KX + 60 + q * (VX - KX - 80), FLOOR - 62 + Math.sin(q * 12 + i) * 10, 7, '#c7ecee');
        }
      }
      const ice = seg(p, 0.3, 0.55), crack = seg(p, 0.6, 0.7), shatter = seg(p, 0.7, 0.9);
      if (shatter === 0) {
        who(c, v, VX, FLOOR, -1, t * (1 - ice));
        if (ice > 0) {
          c.fillStyle = `rgba(160,220,255,${ice * 0.55})`; c.strokeStyle = `rgba(230,250,255,${ice})`; c.lineWidth = 4;
          c.beginPath(); c.roundRect(VX - 70, FLOOR - 160, 140, 165, 10); c.fill(); c.stroke();
          c.fillStyle = `rgba(255,255,255,${ice * 0.5})`; c.fillRect(VX - 58, FLOOR - 150, 12, 120);
        }
        if (crack > 0) {
          c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath();
          c.moveTo(VX - 20, FLOOR - 160); c.lineTo(VX, FLOOR - 100 * crack - 60); c.lineTo(VX - 25, FLOOR - 60); c.lineTo(VX + 10, FLOOR);
          c.moveTo(VX, FLOOR - 110); c.lineTo(VX + 50 * crack, FLOOR - 130); c.stroke();
        }
      } else {
        body(c, v, VX, FLOOR);
        c.fillStyle = 'rgba(160,220,255,0.35)'; c.beginPath(); c.ellipse(VX, FLOOR - 20, 70, 26, 0, 0, 7); c.fill();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          c.save(); c.translate(VX + Math.cos(a) * shatter * 170, FLOOR - 80 + Math.sin(a) * shatter * 120 + shatter * shatter * 80); c.rotate(a + shatter * 6);
          c.fillStyle = `rgba(200,240,255,${1 - shatter})`; c.beginPath(); c.moveTo(0, -12); c.lineTo(8, 6); c.lineTo(-8, 6); c.closePath(); c.fill(); c.restore();
        }
        word(c, 'SHATTER!', VX, 100, shatter, '#c7ecee');
      }
    } },
    ufo: { name: 'UFO Abduction', draw(c, p, t, k, v) {
      stage(c, '#0c0f2a');
      who(c, k, KX, FLOOR, 1, t);
      const arrive = easeOut(seg(p, 0, 0.22)), leave = easeIn(seg(p, 0.66, 0.82));
      const ux = -120 + arrive * (VX + 120) + leave * 500, uy = 80 + Math.sin(t * 4) * 5;
      const lift = easeOut(seg(p, 0.25, 0.62));
      if (p > 0.22 && p < 0.66) {
        c.fillStyle = 'rgba(180,255,180,0.25)';
        c.beginPath(); c.moveTo(ux - 26, uy + 16); c.lineTo(ux + 26, uy + 16); c.lineTo(ux + 80, FLOOR + 10); c.lineTo(ux - 80, FLOOR + 10); c.closePath(); c.fill();
      }
      if (p < 0.64) who(c, v, VX, FLOOR - lift * (FLOOR - uy - 40), -1, t, { scale: 1 - lift * 0.5 });
      c.save(); c.translate(ux, uy);
      Draw.ellipse(c, 0, -10, 26, 22, 'rgba(129,236,236,0.85)', '#111', 3);
      Draw.ellipse(c, 0, 4, 64, 18, '#a4b0be', '#111', 3);
      for (let i = -2; i <= 2; i++) Draw.ellipse(c, i * 22, 6, 5, 5, (Math.floor(t * 6) + i) % 2 ? '#ffeaa7' : '#ff6b81');
      c.restore();
      if (p > 0.82) {
        const f = easeIn(seg(p, 0.82, 0.96));
        body(c, v, VX, 60 + f * (FLOOR - 60));
        if (p > 0.96) stars(c, VX, FLOOR - 70, t);
      }
    } },
    banana: { name: 'Banana Slip', draw(c, p, t, k, v) {
      stage(c, '#2a1a10');
      who(c, k, KX, FLOOR, 1, t);
      const toss = seg(p, 0.02, 0.22), px = KX + 40 + toss * (390 - KX - 40), py = FLOOR - 70 - Math.sin(toss * Math.PI) * 120 + toss * 66;
      c.save(); c.translate(px, py); c.rotate(toss * 8);
      c.fillStyle = '#f9ca24'; c.strokeStyle = '#7a5c00'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 18, 6, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-6, 2); c.lineTo(-20, 12); c.lineTo(-10, 4); c.moveTo(6, 2); c.lineTo(18, 12); c.lineTo(8, 4); c.fill(); c.stroke();
      c.restore();
      const walk = seg(p, 0.22, 0.45), slip = seg(p, 0.45, 0.68);
      if (slip === 0) who(c, v, VX - walk * 60, FLOOR, -1, t, { moving: walk > 0 && walk < 1 });
      else if (slip < 1) {
        c.save(); c.translate(VX - 60 - slip * 40, FLOOR - Math.sin(slip * Math.PI) * 110); c.rotate(slip * 4);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
      } else {
        body(c, v, VX - 100, FLOOR);
        stars(c, VX - 100, FLOOR - 70, t);
        word(c, 'BONK!', VX - 80, 110, seg(p, 0.68, 0.8));
      }
    } },
    glove: { name: 'Boxing Glove', draw(c, p, t, k, v) {
      stage(c, '#2a0f18');
      who(c, k, KX, FLOOR, 1, t);
      const out = easeOut(seg(p, 0.12, 0.26)) * (1 - seg(p, 0.36, 0.5));
      const gx = KX + 40 + out * (VX - KX - 70), gy = FLOOR - 60;
      c.strokeStyle = '#95a5a6'; c.lineWidth = 4; c.beginPath(); c.moveTo(KX + 40, gy);
      for (let i = 1; i <= 12; i++) c.lineTo(KX + 40 + (gx - KX - 40) * i / 12, gy + (i % 2 ? -10 : 10));
      c.stroke();
      Draw.ellipse(c, gx + 16, gy, 24, 20, '#e74c3c', '#111', 3);
      Draw.ellipse(c, gx + 6, gy - 12, 8, 7, '#c0392b', '#111', 2);
      const fly = easeOut(seg(p, 0.26, 0.6));
      if (p < 0.26) who(c, v, VX, FLOOR, -1, t);
      else if (fly < 1) {
        c.save(); c.translate(VX + fly * 320, FLOOR - Math.sin(fly * Math.PI * 0.9) * 230); c.rotate(fly * 10);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
      }
      word(c, 'POW!', VX - 10, 120, seg(p, 0.26, 0.4) * (p < 0.6 ? 1 : 0), '#ff4757');
      if (p > 0.66) {
        const f = easeIn(seg(p, 0.66, 0.82));
        body(c, v, VX + 60, -40 + f * (FLOOR + 40));
        if (p > 0.82) stars(c, VX + 60, FLOOR - 70, t);
      }
    } },
  };

  // Plays a scene in `host` (an element); calls done() at the end.
  function play(host, id, killer, victim, caption, done, ms = 2900) {
    const scene = SCENES[id] || SCENES.zap;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H; cv.className = 'killanim-canvas';
    host.appendChild(cv);
    const cap = document.createElement('div');
    cap.className = 'killanim-caption';
    cap.innerHTML = `<span>★ ${scene.name}</span>${caption || ''}`;
    host.appendChild(cap);
    const c = cv.getContext('2d');
    const t0 = performance.now();
    const frame = (now) => {
      if (!cv.isConnected) return;
      const el = now - t0, p = Math.min(1, el / ms);
      c.save(); scene.draw(c, p, el / 1000, killer, victim); c.restore();
      if (p < 1) requestAnimationFrame(frame);
      else if (done) setTimeout(done, 500);
    };
    requestAnimationFrame(frame);
  }

  return { SCENES, play };
})();
