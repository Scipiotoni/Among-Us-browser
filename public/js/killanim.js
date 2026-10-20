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
    pistol: { name: 'Quick Draw', draw(c, p, t, k, v) {
      stage(c, '#2a1d12');
      who(c, k, KX, FLOOR, 1, t);
      const draw = easeOut(seg(p, 0.05, 0.2));
      // cartoon blaster pistol
      c.save(); c.translate(KX + 30 + draw * 30, FLOOR - 62); c.rotate(-0.1 + (p > 0.3 && p < 0.38 ? -0.35 : 0));
      c.fillStyle = '#4b4f5a'; c.strokeStyle = '#111'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(0, -8, 46, 14, 3); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(4, 2, 12, 20, 3); c.fillStyle = '#7b4a2a'; c.fill(); c.stroke();
      c.restore();
      if (p > 0.3 && p < 0.4) {
        Draw.star(c, KX + 112, FLOOR - 66, 20, '#ffd32a');
        c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(KX + 130, FLOOR - 66); c.lineTo(KX + 130 + seg(p, 0.3, 0.38) * (VX - KX - 150), FLOOR - 64); c.stroke();
      }
      word(c, 'BANG!', KX + 120, 120, seg(p, 0.3, 0.45) * (p < 0.7 ? 1 : 0));
      const fall = seg(p, 0.38, 0.62);
      if (fall === 0) who(c, v, VX, FLOOR, -1, t);
      else if (fall < 1) {
        c.save(); c.translate(VX + fall * 30, FLOOR); c.rotate(fall * 1.5);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
      } else { body(c, v, VX + 40, FLOOR); stars(c, VX + 40, FLOOR - 70, t); }
      if (p > 0.42) for (let i = 0; i < 3; i++) puff(c, KX + 106 + Math.sin(t * 3 + i) * 4, FLOOR - 76 - seg(p, 0.42, 1) * 50 - i * 12, 5 + i * 2, 0.4 * (1 - seg(p, 0.42, 1)));
    } },
    knife: { name: 'Backstab', draw(c, p, t, k, v) {
      stage(c, '#151025');
      const sneak = seg(p, 0.1, 0.3);
      const kx = p < 0.2 ? KX : VX + 75;
      if (p > 0.18 && p < 0.24) for (let i = 0; i < 6; i++) puff(c, KX + (i - 3) * 14, FLOOR - 40 - i * 6, 14, 0.5, '160,140,200');
      if (p > 0.18 && p < 0.26) for (let i = 0; i < 6; i++) puff(c, VX + 75 + (i - 3) * 14, FLOOR - 40 - i * 6, 14, 0.5, '160,140,200');
      if (p < 0.2 || p > 0.24) who(c, k, kx, FLOOR, p < 0.2 ? 1 : -1, t, { alpha: p < 0.2 ? 1 - sneak * 2 : Math.min(1, (p - 0.24) * 8) });
      const stab = seg(p, 0.36, 0.44);
      if (p > 0.26) {
        c.save(); c.translate(VX + 50 - stab * 22, FLOOR - 66); c.scale(-1, 1);
        c.fillStyle = '#dfe6e9'; c.strokeStyle = '#111'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(0, -4); c.lineTo(30, -1); c.lineTo(0, 4); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#2d3436'; c.fillRect(-14, -4, 14, 8);
        if (Math.sin(t * 10) > 0.6) Draw.star(c, 22, -6, 5, '#fff');
        c.restore();
      }
      word(c, 'STAB!', VX, 110, seg(p, 0.42, 0.55) * (p < 0.8 ? 1 : 0), '#ff4757');
      const jump = seg(p, 0.42, 0.62);
      if (jump === 0) who(c, v, VX, FLOOR, -1, t);
      else if (jump < 1) {
        c.save(); c.translate(VX - jump * 40, FLOOR - Math.sin(jump * Math.PI) * 80); c.rotate(-jump * 1.4);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
        if (jump < 0.4) Draw.star(c, VX, FLOOR - 70, 26 * (1 - jump * 2), '#fff');
      } else { body(c, v, VX - 50, FLOOR); stars(c, VX - 50, FLOOR - 70, t); }
    } },
    sword: { name: 'Sword Slash', draw(c, p, t, k, v) {
      stage(c, '#1d1430');
      const dash = easeOut(seg(p, 0.2, 0.34));
      const kx = KX + dash * (VX + 120 - KX);
      if (dash > 0 && dash < 1) for (let i = 1; i < 5; i++) who(c, k, kx - i * 40, FLOOR, 1, t, { alpha: 0.15 });
      who(c, k, kx, FLOOR, dash >= 1 ? -1 : 1, t);
      c.save(); c.translate(kx + (dash >= 1 ? -40 : 40), FLOOR - 70); c.rotate(dash >= 1 ? 2.4 : -0.6);
      c.fillStyle = '#dfe6e9'; c.strokeStyle = '#111'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(0, -4); c.lineTo(60, -2); c.lineTo(66, 0); c.lineTo(60, 2); c.lineTo(0, 4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#f9ca24'; c.fillRect(-4, -10, 6, 20); c.fillStyle = '#6d4c41'; c.fillRect(-18, -3, 14, 6);
      c.restore();
      if (p > 0.26 && p < 0.42) {
        c.strokeStyle = `rgba(255,255,255,${1 - seg(p, 0.26, 0.42)})`; c.lineWidth = 8;
        c.beginPath(); c.arc(VX, FLOOR - 70, 70, -2.2, 0.6); c.stroke();
      }
      word(c, 'SLASH!', VX - 40, 105, seg(p, 0.3, 0.45) * (p < 0.75 ? 1 : 0), '#74b9ff');
      const spin = seg(p, 0.36, 0.62);
      if (spin === 0) who(c, v, VX, FLOOR, -1, t);
      else if (spin < 1) {
        c.save(); c.translate(VX - spin * 30, FLOOR - Math.sin(spin * Math.PI) * 50); c.rotate(spin * 8);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
      } else { body(c, v, VX - 30, FLOOR); stars(c, VX - 30, FLOOR - 70, t); }
    } },
    bow: { name: 'Bullseye', draw(c, p, t, k, v) {
      stage(c, '#14261a');
      who(c, k, KX, FLOOR, 1, t);
      const pull = seg(p, 0.05, 0.25);
      c.save(); c.translate(KX + 50, FLOOR - 66);
      c.strokeStyle = '#8b5a2b'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 34, -1.2, 1.2); c.stroke();
      c.strokeStyle = '#eee'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Math.cos(-1.2) * 34, Math.sin(-1.2) * 34); c.lineTo(-pull * 20, 0); c.lineTo(Math.cos(1.2) * 34, Math.sin(1.2) * 34); c.stroke();
      c.restore();
      const fly = seg(p, 0.28, 0.42);
      const ax = p < 0.28 ? KX + 50 - pull * 20 : KX + 50 + fly * (VX - KX - 70);
      const vx2 = VX + seg(p, 0.42, 0.7) * 0;
      if (p < 0.7) {
        c.save(); c.translate(p < 0.42 ? ax : VX - 20, FLOOR - 66);
        c.strokeStyle = '#6d4c41'; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, 0); c.lineTo(0, 0); c.stroke();
        c.fillStyle = '#95a5a6'; c.beginPath(); c.moveTo(0, -5); c.lineTo(12, 0); c.lineTo(0, 5); c.fill();
        c.fillStyle = '#e74c3c'; c.beginPath(); c.moveTo(-40, 0); c.lineTo(-48, -6); c.lineTo(-36, 0); c.lineTo(-48, 6); c.fill();
        c.restore();
      }
      word(c, 'THWACK!', VX, 110, seg(p, 0.42, 0.55) * (p < 0.8 ? 1 : 0));
      const wob = seg(p, 0.42, 0.7);
      if (wob < 1) {
        c.save(); c.translate(vx2, FLOOR); c.rotate(Math.sin(wob * 20) * 0.2 * (1 - wob) + wob * wob * 1.4);
        Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
      } else { body(c, v, VX + 20, FLOOR); stars(c, VX + 20, FLOOR - 70, t); }
    } },
    piano: { name: 'Piano Drop', draw(c, p, t, k, v) {
      stage(c);
      who(c, k, KX, FLOOR, 1, t);
      const fall = easeIn(seg(p, 0.12, 0.36));
      const y = -150 + fall * (FLOOR - 70 + 150);
      if (p < 0.36) who(c, v, VX, FLOOR, -1, t);
      else {
        body(c, v, VX, FLOOR + 6, { sy: 0.4, sx: 1.4 });
        for (let i = 0; i < 6; i++) { const a = seg(p, 0.36, 0.8); c.fillStyle = `rgba(255,255,255,${1 - a})`; c.font = 'bold 26px sans-serif'; c.fillText(['♪', '♫'][i % 2], VX - 80 + i * 32, FLOOR - 120 - a * 80 - (i % 3) * 14); }
        word(c, 'PLONK!', VX, 90, seg(p, 0.36, 0.5));
      }
      c.save(); c.translate(VX, Math.min(y, FLOOR - 70));
      c.fillStyle = '#1e1e24'; c.strokeStyle = '#000'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(-90, -50, 180, 70, 8); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(-80, 0, 160, 18);
      c.fillStyle = '#111'; for (let i = 0; i < 14; i++) if (i % 7 !== 2 && i % 7 !== 6) c.fillRect(-74 + i * 11.5, 0, 6, 11);
      c.fillStyle = '#1e1e24'; c.fillRect(-80, 20, 8, 40); c.fillRect(72, 20, 8, 40);
      c.restore();
    } },
    meteor: { name: 'Meteor Strike', draw(c, p, t, k, v) {
      stage(c, '#24101a');
      who(c, k, KX, FLOOR, 1, t);
      const fall = easeIn(seg(p, 0.1, 0.4));
      const mx = W + 60 - fall * (W + 60 - VX), my = -80 + fall * (FLOOR - 40 + 80);
      if (p < 0.4) {
        who(c, v, VX, FLOOR, -1, t);
        for (let i = 0; i < 8; i++) puff(c, mx + i * 14, my - i * 10, 18 - i, 0.5 - i * 0.05, '255,140,40');
        Draw.ellipse(c, mx, my, 26, 24, '#6d4c41', '#111', 3);
        Draw.ellipse(c, mx - 6, my - 6, 6, 5, '#4e342e');
      } else {
        const b = seg(p, 0.4, 0.75);
        if (b < 1) { c.fillStyle = `rgba(255,${180 - b * 120},40,${1 - b})`; c.beginPath(); c.arc(VX, FLOOR - 30, 30 + b * 150, 0, 7); c.fill(); }
        body(c, v, VX, FLOOR, { alpha: seg(p, 0.5, 0.7) });
        Draw.ellipse(c, VX + 40, FLOOR - 6, 22, 10, '#4e342e', '#111', 2);
        word(c, 'KABOOM!', VX - 20, 90, b, '#ff9f1a');
      }
    } },
    lightning: { name: 'Thunder Strike', draw(c, p, t, k, v) {
      stage(c, '#0b0f1e');
      const dark = seg(p, 0.05, 0.25);
      c.fillStyle = `rgba(0,0,0,${dark * 0.4})`; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) Draw.ellipse(c, VX - 70 + i * 45, 50 + (i % 2) * 10, 50, 26, `rgba(70,75,95,${dark})`);
      who(c, k, KX, FLOOR, 1, t);
      const strike = p > 0.32 && p < 0.42;
      if (strike) {
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#fff6a0'; c.lineWidth = 8; c.shadowColor = '#fff'; c.shadowBlur = 24;
        c.beginPath(); c.moveTo(VX + 10, 60); c.lineTo(VX - 20, 140); c.lineTo(VX + 15, 150); c.lineTo(VX - 10, FLOOR - 70); c.stroke(); c.shadowBlur = 0;
      }
      if (p < 0.42) who(c, v, VX, FLOOR, -1, t);
      else {
        body(c, v, VX, FLOOR);
        const s2 = seg(p, 0.42, 1);
        for (let i = 0; i < 4; i++) puff(c, VX - 30 + i * 20, FLOOR - 30 - s2 * 90 - i * 10, 10 + s2 * 18, 0.5 * (1 - s2), '120,120,130');
        word(c, 'ZZZAP!', VX, 120, seg(p, 0.42, 0.55), '#fff6a0');
      }
    } },
    pumpkin: { name: 'Pumpkin Smash', draw(c, p, t, k, v) {
      stage(c, '#1a0b22');
      who(c, k, KX, FLOOR, 1, t);
      const fall = easeIn(seg(p, 0.12, 0.34)), lift = easeOut(seg(p, 0.66, 0.86));
      const py = -140 + fall * (FLOOR - 70 + 140) - lift * 420;
      if (p < 0.34) who(c, v, VX, FLOOR, -1, t);
      else body(c, v, VX, FLOOR, { alpha: seg(p, 0.66, 0.75) });
      c.save(); c.translate(VX, py);
      Draw.ellipse(c, 0, 0, 80, 64, '#ff7b1c', '#111', 4);
      c.strokeStyle = 'rgba(120,50,0,0.5)'; c.lineWidth = 3; for (const x of [-34, 0, 34]) { c.beginPath(); c.ellipse(x, 0, 20, 62, 0, 0, 7); c.stroke(); }
      const glow = p > 0.34 && p < 0.66 ? 0.6 + Math.sin(t * 12) * 0.4 : 0.4;
      c.fillStyle = `rgba(255,230,90,${glow})`;
      c.beginPath(); c.moveTo(-40, -14); c.lineTo(-24, -34); c.lineTo(-12, -12); c.moveTo(12, -12); c.lineTo(24, -34); c.lineTo(40, -14); c.fill();
      c.beginPath(); c.moveTo(-42, 12); for (let i = 0; i <= 8; i++) c.lineTo(-42 + i * 10.5, 12 + (i % 2 ? 12 : 0)); c.lineTo(42, 30); c.quadraticCurveTo(0, 46, -42, 30); c.fill();
      c.fillStyle = '#2d6a1f'; c.fillRect(-6, -78, 12, 18);
      c.restore();
      word(c, 'BOO!', VX, 90, seg(p, 0.36, 0.5) * (p < 0.66 ? 1 : 0), '#ff7b1c');
    } },
    bats: { name: 'Bat Swarm', draw(c, p, t, k, v) {
      stage(c, '#140a22');
      who(c, k, KX, FLOOR, 1, t);
      const swarm = seg(p, 0.1, 0.35), leave = seg(p, 0.62, 0.85);
      if (p < 0.6) who(c, v, VX, FLOOR, -1, t, { alpha: 1 - seg(p, 0.45, 0.6) });
      else body(c, v, VX, FLOOR, { alpha: seg(p, 0.62, 0.75) });
      for (let i = 0; i < 14; i++) {
        const a = t * (3 + (i % 3)) + i * 0.9, r = 70 - swarm * 20 + leave * 500;
        const bx = KX + (VX - KX) * swarm + Math.cos(a) * r * swarm, by = FLOOR - 70 + Math.sin(a) * r * 0.6 * swarm - leave * 200;
        if (swarm === 0) continue;
        const f = Math.sin(t * 16 + i) * 6;
        c.fillStyle = '#05020a';
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 9, by - 7 - f, bx - 18, by - 2 - f); c.quadraticCurveTo(bx - 10, by + 2, bx, by + 4);
        c.quadraticCurveTo(bx + 10, by + 2, bx + 18, by - 2 - f); c.quadraticCurveTo(bx + 9, by - 7 - f, bx, by); c.fill();
        c.fillStyle = '#ff4757'; c.fillRect(bx - 2, by - 1, 1.5, 1.5); c.fillRect(bx + 1, by - 1, 1.5, 1.5);
      }
    } },
    present: { name: 'Surprise Present', draw(c, p, t, k, v) {
      stage(c, '#0d1a2a');
      who(c, k, KX, FLOOR, 1, t);
      const fall = easeIn(seg(p, 0.1, 0.3)), open = seg(p, 0.4, 0.5);
      const gy = -100 + fall * (FLOOR - 40 + 100);
      if (p < 0.5) who(c, v, VX + 20, FLOOR, -1, t);
      if (open < 1) {
        c.save(); c.translate(VX - 60, Math.min(gy, FLOOR - 40) + (p > 0.3 && p < 0.4 ? Math.sin(t * 40) * 3 : 0));
        c.fillStyle = '#e84118'; c.strokeStyle = '#111'; c.lineWidth = 3; c.fillRect(-36, -36, 72, 72); c.strokeRect(-36, -36, 72, 72);
        c.fillStyle = '#ffd32a'; c.fillRect(-7, -36, 14, 72); c.fillRect(-36, -7, 72, 14);
        c.translate(0, -36 - open * 80); c.rotate(open * 2);
        c.fillStyle = '#c23616'; c.fillRect(-40, -12, 80, 14); c.strokeRect(-40, -12, 80, 14);
        Draw.ellipse(c, -10, -18, 10, 7, '#ffd32a', '#111', 2); Draw.ellipse(c, 10, -18, 10, 7, '#ffd32a', '#111', 2);
        c.restore();
      }
      const boom = seg(p, 0.45, 0.8);
      if (boom > 0 && boom < 1) {
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          c.fillStyle = ['#ff4757', '#2ed573', '#ffd32a', '#1e90ff', '#fff'][i % 5];
          c.save(); c.translate(VX - 20 + Math.cos(a) * boom * 200, FLOOR - 60 + Math.sin(a) * boom * 140 + boom * boom * 60); c.rotate(a + boom * 8);
          c.fillRect(-4, -2, 8, 4); c.restore();
        }
        word(c, 'SURPRISE!', VX - 30, 90, boom, '#2ed573');
      }
      if (p > 0.5) body(c, v, VX + 20, FLOOR, { alpha: seg(p, 0.5, 0.6) });
    } },
    snowballs: { name: 'Snowball Barrage', draw(c, p, t, k, v) {
      stage(c, '#10223a');
      who(c, k, KX, FLOOR, 1, t);
      const hits = Math.floor(seg(p, 0.12, 0.6) * 8);
      for (let i = 0; i < 8; i++) {
        const s0 = 0.12 + i * 0.06, q = seg(p, s0, s0 + 0.08);
        if (q > 0 && q < 1) Draw.ellipse(c, KX + 50 + q * (VX - KX - 60), FLOOR - 60 - Math.sin(q * Math.PI) * 60 + (i % 3) * 12, 9, 9, '#fff', '#9fb6cc', 2);
      }
      const buried = seg(p, 0.55, 0.75);
      if (buried < 1) who(c, v, VX, FLOOR, -1, t);
      for (let i = 0; i < hits; i++) Draw.ellipse(c, VX - 24 + (i * 17) % 50, FLOOR - 30 - ((i * 23) % 70), 11, 10, '#fff', '#9fb6cc', 2);
      if (buried > 0) {
        c.fillStyle = '#f5faff'; c.strokeStyle = '#9fb6cc'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(VX - 80, FLOOR + 2); c.quadraticCurveTo(VX, FLOOR - 170 * buried, VX + 80, FLOOR + 2); c.fill(); c.stroke();
      }
      if (p > 0.8) {
        Draw.ellipse(c, VX - 10, FLOOR - 90, 7, 7, '#111'); Draw.ellipse(c, VX + 14, FLOOR - 90, 7, 7, '#111');
        word(c, 'BRRR!', VX, 70, seg(p, 0.8, 0.9), '#c7ecee');
      }
    } },
    shark: { name: 'Shark Attack', draw(c, p, t, k, v) {
      stage(c, '#08304a');
      const rise = easeOut(seg(p, 0.05, 0.25)) * (1 - easeIn(seg(p, 0.8, 0.95)));
      who(c, k, KX, FLOOR, 1, t);
      const jump = seg(p, 0.38, 0.62);
      if (jump < 0.5) who(c, v, VX, FLOOR - rise * 20, -1, t);
      // water
      const wy = FLOOR + 10 - rise * 60;
      c.fillStyle = 'rgba(30,144,255,0.55)'; c.beginPath(); c.moveTo(VX - 160, H);
      for (let x = VX - 160; x <= VX + 180; x += 20) c.lineTo(x, wy + Math.sin(x / 20 + t * 4) * 5);
      c.lineTo(VX + 180, H); c.fill();
      const finX = VX + 140 - seg(p, 0.15, 0.38) * 140;
      if (p < 0.38) { c.fillStyle = '#7f8fa6'; c.beginPath(); c.moveTo(finX, wy - 40); c.lineTo(finX + 26, wy); c.lineTo(finX - 10, wy); c.closePath(); c.fill(); }
      if (jump > 0 && jump < 1) {
        c.save(); c.translate(VX, wy - Math.sin(jump * Math.PI) * 170); c.rotate(-0.6 + jump * 1.2);
        Draw.ellipse(c, 0, 0, 70, 28, '#7f8fa6', '#111', 3);
        Draw.ellipse(c, 0, 10, 52, 12, '#dfe6e9');
        c.fillStyle = '#7f8fa6'; c.beginPath(); c.moveTo(-4, -26); c.lineTo(10, -54); c.lineTo(22, -24); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-68, 0); c.lineTo(-96, -24); c.lineTo(-90, 22); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(34 + i * 5, 6); c.lineTo(36 + i * 5, 14); c.lineTo(38 + i * 5, 6); c.fill(); }
        Draw.ellipse(c, 44, -8, 3, 3, '#111');
        c.restore();
        word(c, 'CHOMP!', VX, 70, jump);
      }
      if (p > 0.62) {
        for (let i = 0; i < 8; i++) Draw.ellipse(c, VX - 60 + i * 18, wy - seg(p, 0.62, 0.75) * 50 * Math.sin(i), 6, 6, 'rgba(200,235,255,0.8)');
        body(c, v, VX, FLOOR, { alpha: seg(p, 0.85, 0.95) });
      }
    } },
    coconut: { name: 'Coconut Bonk', draw(c, p, t, k, v) {
      stage(c, '#1d3a2a');
      who(c, k, KX, FLOOR, 1, t);
      const shake = p > 0.1 && p < 0.3 ? Math.sin(t * 40) * 4 : 0;
      c.save(); c.translate(VX + 80 + shake, FLOOR);
      c.strokeStyle = '#8b5a2b'; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-20, -120, -40, -230); c.stroke();
      c.fillStyle = '#27ae60'; for (let i = 0; i < 6; i++) { c.save(); c.translate(-40, -230); c.rotate(i * 1.05 + 0.3); c.beginPath(); c.ellipse(40, 0, 44, 10, 0.2, 0, 7); c.fill(); c.restore(); }
      c.restore();
      const fall = easeIn(seg(p, 0.3, 0.45));
      const cy = FLOOR - 230 + 20 + fall * (230 - 20 - 120);
      if (p < 0.62) Draw.ellipse(c, VX + 40 - fall * 40, p < 0.45 ? cy : FLOOR - 125 - Math.sin(seg(p, 0.45, 0.62) * Math.PI) * 50, 14, 13, '#6d4c41', '#111', 2.5);
      if (p < 0.45) who(c, v, VX, FLOOR, -1, t);
      else {
        const wob = seg(p, 0.45, 0.65);
        if (wob < 1) {
          c.save(); c.translate(VX, FLOOR); c.rotate(Math.sin(wob * 18) * 0.25 + wob * wob * 1.5);
          Draw.character(c, 0, 0, { ...v, dir: -1, scale: S, phase: t, noPet: true }); c.restore();
        } else body(c, v, VX + 10, FLOOR);
        stars(c, VX, FLOOR - 140 + wob * 70, t);
        word(c, 'BONK!', VX - 40, 100, seg(p, 0.45, 0.6));
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
