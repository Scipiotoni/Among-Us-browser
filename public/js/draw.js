// Character rendering: an original round "blob" astronaut with big eyes, stubby feet and an antenna.
// Cosmetics are looked up in SHARED.COSMETIC_BY_ID and drawn by the renderers below.
const Draw = (() => {
  const colorById = {};
  for (const c of SHARED.COLORS) colorById[c.id] = c;
  const col = (id) => colorById[id] || SHARED.COLORS[0];
  const item = (cat, id) => SHARED.COSMETIC_BY_ID[cat][id] || SHARED.COSMETIC_BY_ID[cat][SHARED.COSMETIC_DEFAULTS[cat]];
  const RAINBOW = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

  function ellipse(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 3; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function star(ctx, x, y, r, fill) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function heart(ctx, x, y, s, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.4, x, y - s * 0.5);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    ctx.fillStyle = fill; ctx.fill();
  }
  const clipBody = (ctx) => { ctx.beginPath(); ctx.ellipse(0, -30, 21.5, 22.5, 0, 0, Math.PI * 2); ctx.clip(); };

  // Draws a character with feet at (x, y). o: profile fields + dir, phase, scale, alpha, ghost, moving, dead
  function character(ctx, x, y, o) {
    const s = o.scale || 1;
    const c = col(o.color);
    const dir = o.dir || 1;
    const t = o.phase || 0;
    const hat = item('hat', o.hat), outfit = item('outfit', o.outfit);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    const bob = o.moving ? Math.abs(Math.sin(t * 10)) * 3 : Math.sin(t * 2) * 0.8;
    const float = o.ghost ? Math.sin(t * 3) * 4 - 8 : 0;
    ctx.translate(0, float);

    if (!o.ghost) ellipse(ctx, 0, 0, 22, 6, 'rgba(0,0,0,0.25)');
    if (outfit.back) drawOutfitBack(ctx, outfit, dir, t, bob, o.moving);

    if (!o.ghost) {
      const step = o.moving ? Math.sin(t * 10) * 6 : 0;
      ellipse(ctx, -9 + step, -5, 8, 6, c.shade, '#111', 2.5);
      ellipse(ctx, 9 - step, -5, 8, 6, c.shade, '#111', 2.5);
    }

    ctx.translate(0, -bob);
    ctx.beginPath();
    if (o.ghost) {
      ctx.moveTo(-23, -28);
      ctx.bezierCurveTo(-23, -62, 23, -62, 23, -28);
      ctx.lineTo(23, -8);
      for (let i = 0; i <= 4; i++) {
        const xx = 23 - i * 11.5;
        ctx.quadraticCurveTo(xx - 5.75, -8 + (i % 2 ? -6 : 6) + Math.sin(t * 6 + i) * 2, xx - 11.5, -8);
      }
      ctx.closePath();
    } else {
      ctx.ellipse(0, -30, 23, 24, 0, 0, Math.PI * 2);
    }
    const grad = ctx.createLinearGradient(-dir * 20, -50, dir * 20, -8);
    grad.addColorStop(0, c.body);
    grad.addColorStop(1, c.shade);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#111';
    ctx.stroke();
    ellipse(ctx, dir * 4, -22, 11, 8, 'rgba(255,255,255,0.18)');
    ellipse(ctx, -dir * 9, -44, 5, 3, 'rgba(255,255,255,0.45)');

    if (!outfit.back) drawOutfit(ctx, outfit, dir, c, t);
    drawEyes(ctx, item('eyes', o.eyes), dir, o.dead, t);

    if (hat.ant) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(dir * 4, -53);
      ctx.quadraticCurveTo(dir * 2, -62, -dir * 3, -66 + Math.sin(t * 4) * 1.5);
      ctx.stroke();
      ellipse(ctx, -dir * 3, -67 + Math.sin(t * 4) * 1.5, 4, 4, c.body, '#111', 2);
    }
    drawHat(ctx, hat, dir, t, c);
    ctx.restore();

    if (o.pet && o.pet !== 'none' && !o.ghost && !o.noPet) pet(ctx, x - dir * 38 * s, y + 2 * s, o.pet, dir, t, s * 0.9, o.moving, o.color);
  }

  // ------------------------------------------------------------------ eyes
  function eyeball(ctx, cx, dir, pupil = true) {
    ellipse(ctx, cx, -33, 6, 7, '#fff', '#111', 2);
    if (pupil) { ellipse(ctx, cx + dir * 2, -32, 3, 3.5, '#111'); ellipse(ctx, cx + dir * 2 + 1, -34, 1, 1, '#fff'); }
  }
  function drawEyes(ctx, e, dir, dead, t) {
    const ex = dir * 5;
    const L = ex - 8, R = ex + 8;
    const blink = !dead && (t % 4) > 3.85;
    ctx.lineCap = 'round';
    if (dead) {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      for (const cx of [L, R]) {
        ctx.beginPath(); ctx.moveTo(cx - 4, -37); ctx.lineTo(cx + 4, -29); ctx.moveTo(cx + 4, -37); ctx.lineTo(cx - 4, -29); ctx.stroke();
      }
      return;
    }
    const closed = (cx) => { ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 5, -33); ctx.lineTo(cx + 5, -33); ctx.stroke(); };
    switch (e.draw) {
      case 'cyclops':
        ellipse(ctx, ex, -33, 11, blink ? 1.5 : 11, '#fff', '#111', 2.5);
        if (!blink) ellipse(ctx, ex + dir * 3, -33, 5, 5, '#111');
        return;
      case 'glow':
        ctx.shadowColor = e.c; ctx.shadowBlur = 12;
        for (const cx of [L, R]) { ellipse(ctx, cx, -33, 6, 7, '#111', '#111', 2); ellipse(ctx, cx + dir * 1.5, -33, 3.5, 4.5, e.c); }
        ctx.shadowBlur = 0;
        return;
      case 'spider':
        for (const [x, y, r] of [[L, -33, 5], [R, -33, 5], [L - 4, -41, 2.6], [R + 4, -41, 2.6], [L + 4, -41, 2.4], [R - 4, -41, 2.4], [ex, -26, 2.2]]) {
          ellipse(ctx, x, y, r, r, '#111'); ellipse(ctx, x + dir * r * 0.3, y - r * 0.35, r * 0.3, r * 0.3, '#ff4757');
        }
        return;
      case 'void':
        for (const cx of [L, R]) { ellipse(ctx, cx, -33, 6.5, 7.5, '#05030a', '#111', 2); ellipse(ctx, cx + dir * 1.5, -33, 1.8, 1.8, '#fff'); }
        return;
      case 'galaxyeyes':
        for (const cx of [L, R]) {
          const g = ctx.createRadialGradient(cx, -33, 1, cx, -33, 7.5);
          g.addColorStop(0, '#fd79a8'); g.addColorStop(0.5, '#6c5ce7'); g.addColorStop(1, '#130f40');
          ellipse(ctx, cx, -33, 6.5, 7.5, g, '#111', 2);
          for (let i = 0; i < 3; i++) ellipse(ctx, cx + Math.cos(t * 2 + i * 2.1) * 3.5, -33 + Math.sin(t * 2 + i * 2.1) * 4, 0.9, 0.9, '#fff');
        }
        return;
      case 'shades':
        ctx.fillStyle = e.rainbow ? (() => { const g = ctx.createLinearGradient(ex - 18, 0, ex + 18, 0); RAINBOW.forEach((r, i) => g.addColorStop(i / 5, r)); return g; })() : e.c;
        ctx.beginPath(); ctx.roundRect(ex - 18, -38, 15, 10, 4); ctx.roundRect(ex + 3, -38, 15, 10, 4); ctx.fill();
        ctx.fillRect(ex - 4, -36, 8, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(ex - 15, -36, 4, 2); ctx.fillRect(ex + 6, -36, 4, 2);
        return;
      case 'pixel':
        ctx.fillStyle = '#111';
        ctx.fillRect(ex - 19, -38, 38, 4);
        for (const [x0, w] of [[-18, 14], [4, 14]]) { ctx.fillRect(ex + x0, -34, w, 4); ctx.fillRect(ex + x0 + 2, -30, w - 4, 3); }
        ctx.fillStyle = '#fff'; ctx.fillRect(ex - 16, -34, 3, 3); ctx.fillRect(ex + 6, -34, 3, 3);
        return;
      case 'goggles':
        ctx.fillStyle = '#222'; ctx.fillRect(-23, -37, 46, 5);
        ellipse(ctx, L, -34, 7, 7, '#7fdcff', '#222', 3); ellipse(ctx, R, -34, 7, 7, '#7fdcff', '#222', 3);
        ellipse(ctx, L - 2, -36, 2, 2, '#fff'); ellipse(ctx, R - 2, -36, 2, 2, '#fff');
        return;
      case 'three_d':
        ctx.fillStyle = '#fff'; ctx.fillRect(ex - 19, -39, 38, 12);
        ctx.fillStyle = 'rgba(231,76,60,0.85)'; ctx.fillRect(ex - 17, -37, 14, 8);
        ctx.fillStyle = 'rgba(52,152,219,0.85)'; ctx.fillRect(ex + 3, -37, 14, 8);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(ex - 19, -39, 38, 12);
        return;
      case 'robot':
        ctx.fillStyle = '#2d3436'; ctx.beginPath(); ctx.roundRect(ex - 19, -40, 38, 14, 4); ctx.fill();
        ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ff4757' : '#ff6b81';
        ctx.fillRect(ex - 15, -35, 10, 4); ctx.fillRect(ex + 5, -35, 10, 4);
        return;
      case 'laser':
        eyeball(ctx, L, dir, false); eyeball(ctx, R, dir, false);
        ellipse(ctx, L + dir * 2, -32, 3.5, 3.5, e.c || '#ff1e1e'); ellipse(ctx, R + dir * 2, -32, 3.5, 3.5, e.c || '#ff1e1e');
        ctx.strokeStyle = `${e.c2 || 'rgba(255,30,30,'}${0.45 + Math.sin(t * 12) * 0.25})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(L + dir * 4, -32); ctx.lineTo(L + dir * 40, -24); ctx.moveTo(R + dir * 4, -32); ctx.lineTo(R + dir * 40, -24); ctx.stroke();
        return;
      case 'eyepatch':
        eyeball(ctx, dir > 0 ? R : L, dir);
        ellipse(ctx, dir > 0 ? L : R, -33, 7, 7, '#111');
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, -42); ctx.lineTo(22, -27); ctx.stroke();
        return;
      case 'monocle':
        eyeball(ctx, L, dir); eyeball(ctx, R, dir);
        ctx.strokeStyle = '#f9ca24'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(R, -33, 9, 0, 7); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(R + 6, -26); ctx.quadraticCurveTo(R + 10, -16, R + 4, -10); ctx.stroke();
        return;
      case 'wink':
        eyeball(ctx, dir > 0 ? L : R, dir);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); const w = dir > 0 ? R : L;
        ctx.moveTo(w - 5, -36); ctx.lineTo(w + 3, -33); ctx.lineTo(w - 5, -30); ctx.stroke();
        return;
      case 'spiral':
        for (const cx of [L, R]) {
          ellipse(ctx, cx, -33, 6.5, 7, '#fff', '#111', 2);
          ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.beginPath();
          for (let a = 0; a < 12; a += 0.3) ctx.lineTo(cx + Math.cos(a + t * 6) * a * 0.45, -33 + Math.sin(a + t * 6) * a * 0.45);
          ctx.stroke();
        }
        return;
    }
    for (const cx of [L, R]) {
      if (blink || e.draw === 'sleepy') {
        if (blink) { closed(cx); continue; }
        ellipse(ctx, cx, -33, 6, 3.5, '#fff', '#111', 2);
        ctx.fillStyle = '#111'; ctx.fillRect(cx - 6, -36, 12, 2);
        continue;
      }
      switch (e.draw) {
        case 'happy':
          ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, -31, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
          break;
        case 'hearts':
          heart(ctx, cx, -33, 5, '#ff3d7f');
          break;
        case 'stars':
          ellipse(ctx, cx, -33, 6, 7, '#fff', '#111', 2); star(ctx, cx + dir * 1.5, -33, 4.5, e.c || '#ffd32a');
          break;
        case 'dollar':
          ellipse(ctx, cx, -33, 6, 7, '#fff', '#111', 2);
          ctx.fillStyle = '#27ae60'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', cx + dir, -29);
          break;
        case 'cute':
          ellipse(ctx, cx, -33, 6.5, 8, '#fff', '#111', 2);
          ellipse(ctx, cx + dir * 1.5, -32, 4.5, 5.5, '#111');
          ellipse(ctx, cx + dir * 1.5 + 1.5, -35, 1.8, 1.8, '#fff'); ellipse(ctx, cx + dir * 1.5 - 1.5, -30, 1, 1, '#fff');
          break;
        case 'tired':
          eyeball(ctx, cx, dir);
          ctx.strokeStyle = 'rgba(80,40,90,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, -29, 6, 0.2, Math.PI - 0.2); ctx.stroke();
          ctx.fillStyle = '#111'; ctx.fillRect(cx - 6, -40, 12, 3);
          break;
        case 'cat':
          ellipse(ctx, cx, -33, 6, 7, '#c8f169', '#111', 2);
          ellipse(ctx, cx + dir * 1.5, -33, 1.4, 5, '#111');
          break;
        default:
          eyeball(ctx, cx, dir);
          if (e.draw === 'angry') {
            ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath();
            const inner = cx < ex;
            ctx.moveTo(cx - 6, -41 + (inner ? 0 : 4)); ctx.lineTo(cx + 6, -41 + (inner ? 4 : 0)); ctx.stroke();
          }
      }
    }
    if (e.draw === 'glasses') {
      ctx.strokeStyle = e.c; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(L, -33, 8.5, 0, 7); ctx.moveTo(R + 8.5, -33); ctx.arc(R, -33, 8.5, 0, 7);
      ctx.moveTo(L + 8.5, -34); ctx.lineTo(R - 8.5, -34); ctx.stroke();
    }
  }

  // ------------------------------------------------------------------ outfits
  function drawOutfitBack(ctx, o, dir, t, bob, moving) {
    if (o.draw === 'aura') {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + t * 1.5;
        const r = 30 + Math.sin(t * 5 + i * 1.7) * 4;
        ctx.fillStyle = o.rainbow ? `hsla(${(i * 36 + t * 90) % 360}, 90%, 60%, 0.45)` : (i % 2 ? o.c[0] : o.c[1]) + '77';
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.9, -30 + Math.sin(a) * r, 9, 9, 0, 0, 7); ctx.fill();
      }
    } else if (o.draw === 'wings') {
      const flap = Math.sin(t * (moving ? 10 : 3)) * 0.18;
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * 10, -36 - bob); ctx.rotate(side * (0.35 + flap)); ctx.scale(side, 1);
        const g = ctx.createLinearGradient(0, 0, 40, -20);
        g.addColorStop(0, '#ff4d00'); g.addColorStop(0.6, '#ffb300'); g.addColorStop(1, '#fff3b0');
        ctx.fillStyle = g; ctx.strokeStyle = '#7a1f00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(22, -34, 44, -26);
        for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(40 - k * 9, -14 + k * 3, 34 - k * 10, -12 + k * 5);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else if (o.draw === 'cape') {
      if (o.c2) {
        ctx.fillStyle = o.c2;
        ctx.beginPath(); ctx.moveTo(-dir * 6, -46 - bob); ctx.quadraticCurveTo(-dir * 30, -22, -dir * 22, -8); ctx.lineTo(-dir * 4, -12); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = o.c; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-dir * 6, -46 - bob);
      ctx.quadraticCurveTo(-dir * 34, -20, -dir * 26 - (moving ? Math.sin(t * 10) * 4 : 0), -4);
      ctx.lineTo(-dir * 4, -10);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (o.draw === 'backpack') {
      ctx.fillStyle = '#e17055'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-dir * 30 - 8, -44 - bob, 16, 28, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d35400'; ctx.fillRect(-dir * 30 - 6, -32 - bob, 12, 8);
    }
  }

  function drawOutfit(ctx, o, dir, c, t) {
    const cx = dir * 3;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111';
    switch (o.draw) {
      case 'scarf': {
        const fill = o.rainbow ? (() => { const g = ctx.createLinearGradient(-20, 0, 20, 0); RAINBOW.forEach((r, i) => g.addColorStop(i / 5, r)); return g; })() : o.c;
        ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-20, -20, 40, 7, 3); ctx.fill();
        ctx.fillStyle = o.rainbow ? '#9b59b6' : o.c2; ctx.fillRect(-dir * 12 - 3, -16, 7, 14 + Math.sin(t * 6) * 1.5);
        break;
      }
      case 'tie':
        ctx.fillStyle = o.c;
        ctx.beginPath(); ctx.moveTo(cx - 3, -20); ctx.lineTo(cx + 3, -20); ctx.lineTo(cx + 4, -9); ctx.lineTo(cx, -6); ctx.lineTo(cx - 4, -9); ctx.fill();
        break;
      case 'bowtie':
        ctx.fillStyle = o.c;
        ctx.beginPath(); ctx.moveTo(cx, -18); ctx.lineTo(cx - 8, -23); ctx.lineTo(cx - 8, -13); ctx.closePath();
        ctx.moveTo(cx, -18); ctx.lineTo(cx + 8, -23); ctx.lineTo(cx + 8, -13); ctx.closePath(); ctx.fill();
        ellipse(ctx, cx, -18, 2.5, 2.5, o.c2);
        break;
      case 'heart': heart(ctx, cx + dir * 6, -18, 4, '#ff4d6d'); break;
      case 'bolt':
        ctx.fillStyle = '#f9ca24';
        ctx.beginPath(); ctx.moveTo(cx + 2, -26); ctx.lineTo(cx - 6, -15); ctx.lineTo(cx, -15); ctx.lineTo(cx - 3, -6); ctx.lineTo(cx + 6, -18); ctx.lineTo(cx, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'sheriff': star(ctx, cx + dir * 8, -20, 6, '#f9ca24'); ellipse(ctx, cx + dir * 8, -20, 2, 2, '#c49a00'); break;
      case 'medal':
        ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 8, -26); ctx.lineTo(cx, -16); ctx.lineTo(cx + 8, -26); ctx.stroke();
        ellipse(ctx, cx, -13, 5, 5, '#f9ca24', '#b7950b', 2); break;
      case 'chain':
        ctx.strokeStyle = '#f9ca24'; ctx.lineWidth = 3; ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.arc(0, -36, 22, 0.35 * Math.PI, 0.65 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
        ellipse(ctx, 0, -14, 4, 5, '#f9ca24', '#b7950b', 1.5); break;
      case 'lei':
        for (let i = 0; i < 9; i++) { const a = 0.25 * Math.PI + i * 0.0625 * Math.PI; ellipse(ctx, Math.cos(a) * 21, -38 + Math.sin(a) * 21, 3.5, 3.5, ['#fd79a8', '#fdcb6e', '#ff7675'][i % 3]); }
        break;
      case 'belt':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = '#5d4037'; ctx.fillRect(-25, -16, 50, 6);
        ctx.fillStyle = '#f9ca24'; ctx.fillRect(cx - 4, -17, 8, 8); ctx.fillStyle = '#5d4037'; ctx.fillRect(cx - 2, -15, 4, 4);
        ctx.restore(); break;
      case 'sash':
        ctx.save(); clipBody(ctx);
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-22, -46); ctx.lineTo(22, -12); ctx.stroke();
        ctx.restore(); break;
      case 'vest':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = '#ff7f27'; ctx.fillRect(-25, -28, 50, 22);
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(-25, -22, 50, 3); ctx.fillRect(-25, -14, 50, 3);
        ctx.restore(); break;
      case 'apron':
        ctx.fillStyle = '#f5f6fa'; ctx.beginPath(); ctx.roundRect(cx - 11, -30, 22, 24, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff7675'; ctx.fillRect(cx - 6, -20, 12, 6); break;
      case 'tutu':
        ctx.fillStyle = 'rgba(253,121,168,0.9)';
        ctx.beginPath(); ctx.moveTo(-24, -14); for (let i = 0; i <= 8; i++) ctx.lineTo(-24 + i * 6, -14 + (i % 2 ? 7 : 2)); ctx.lineTo(24, -18); ctx.lineTo(-24, -18); ctx.fill(); break;
      case 'suit':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = o.c; ctx.fillRect(-25, -22, 50, 20);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 6, -22); ctx.lineTo(cx + 6, -22); ctx.lineTo(cx, -10); ctx.fill();
        ctx.fillStyle = o.c2; ctx.fillRect(cx - 1.5, -20, 3, 9);
        ctx.restore(); break;
      case 'labcoat':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = '#f5f6fa'; ctx.fillRect(-25, -24, 50, 22);
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, -24); ctx.lineTo(cx, -2); ctx.stroke();
        ctx.fillStyle = '#74b9ff'; ctx.fillRect(dir * 8, -20, 6, 4);
        ctx.restore(); break;
      case 'overalls':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = '#2e86de'; ctx.fillRect(-25, -18, 50, 18);
        ctx.fillRect(-12, -26, 4, 10); ctx.fillRect(8, -26, 4, 10);
        ellipse(ctx, -10, -18, 2, 2, '#f1c40f'); ellipse(ctx, 10, -18, 2, 2, '#f1c40f');
        ctx.restore(); break;
      case 'pattern': drawPattern(ctx, o.p, t); break;
      case 'lights':
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-22, -40); ctx.quadraticCurveTo(0, -28, 22, -36); ctx.moveTo(-21, -22); ctx.quadraticCurveTo(0, -12, 21, -20); ctx.stroke();
        for (let i = 0; i < 10; i++) {
          const row = i < 5, k = (i % 5) / 4, x = -18 + k * 36, y = row ? -38 + Math.sin(k * Math.PI) * 6 : -20 + Math.sin(k * Math.PI) * 6;
          const on = Math.sin(t * 5 + i * 1.7) > -0.2;
          ellipse(ctx, x, y + 3, 2.6, 3.6, on ? ['#ff4757', '#2ed573', '#ffd32a', '#1e90ff'][i % 4] : '#555');
        }
        break;
      case 'floatie':
        ctx.save(); ctx.translate(0, -12);
        ellipse(ctx, 0, 0, 30, 9, '#ffd32a', '#111', 2.5);
        ellipse(ctx, 0, -1, 20, 4, 'rgba(0,0,0,0.25)');
        ellipse(ctx, dir * 26, -12, 8, 7, '#ffd32a', '#111', 2);
        ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.moveTo(dir * 32, -12); ctx.lineTo(dir * 40, -10); ctx.lineTo(dir * 32, -8); ctx.fill();
        ellipse(ctx, dir * 28, -14, 1.5, 1.5, '#111');
        ctx.restore();
        break;
      case 'armor':
        ctx.save(); clipBody(ctx);
        ctx.fillStyle = o.c; ctx.fillRect(-25, -24, 50, 24);
        ctx.strokeStyle = o.c2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-25, -24); ctx.lineTo(25, -24); ctx.moveTo(cx, -24); ctx.lineTo(cx, 0); ctx.moveTo(-25, -12); ctx.lineTo(25, -12); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - 14 + ((t * 30) % 40), -24, 4, 24);
        ctx.restore();
        ellipse(ctx, cx, -18, 4, 4, '#e84393', o.c2, 2);
        break;
    }
  }

  function drawPattern(ctx, p, t) {
    ctx.save(); clipBody(ctx);
    switch (p) {
      case 'stars':
        star(ctx, -10, -20, 4, '#ffeaa7'); star(ctx, 8, -14, 3.5, '#ffeaa7'); star(ctx, 12, -40, 3, '#ffeaa7'); star(ctx, -14, -42, 2.5, '#ffeaa7'); break;
      case 'polka':
        for (const [x, y] of [[-12, -18], [6, -12], [14, -26], [-4, -26], [-16, -36], [14, -42], [0, -46]]) ellipse(ctx, x, y, 3.2, 3.2, 'rgba(255,255,255,0.75)'); break;
      case 'camo':
        for (const [x, y, r, cl] of [[-10, -20, 8, '#556b2f'], [10, -14, 7, '#3e4a26'], [8, -40, 8, '#6b8e23'], [-12, -42, 6, '#3e4a26'], [0, -28, 6, '#8f9779']]) {
          ctx.globalAlpha = 0.75; ellipse(ctx, x, y, r, r * 0.7, cl);
        }
        ctx.globalAlpha = 1; break;
      case 'tiger':
        ctx.strokeStyle = 'rgba(20,20,20,0.75)'; ctx.lineWidth = 3;
        for (let i = -18; i <= 18; i += 9) { ctx.beginPath(); ctx.moveTo(i - 3, -54); ctx.quadraticCurveTo(i + 4, -44, i - 2, -36); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i + 3, -6); ctx.quadraticCurveTo(i - 4, -14, i + 2, -22); ctx.stroke(); }
        break;
      case 'zombie':
        ctx.fillStyle = 'rgba(120,180,90,0.8)'; ctx.fillRect(-18, -24, 12, 10); ctx.fillRect(8, -46, 9, 8);
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(-17 + i * 3, -26); ctx.lineTo(-17 + i * 3, -12); } ctx.stroke(); break;
      case 'rainbow':
        RAINBOW.forEach((r, i) => { ctx.fillStyle = r; ctx.globalAlpha = 0.6; ctx.fillRect(-25, -28 + i * 4, 50, 4); });
        ctx.globalAlpha = 1; break;
      case 'skeleton':
        ctx.fillStyle = 'rgba(245,245,240,0.92)';
        ctx.fillRect(-2, -26, 4, 22);
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -22 + i * 5, 12 - i * 1.5, 1.8, 0, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(0, -46, 9, 5, 0, 0, 7); ctx.fill();
        break;
      case 'mummy':
        ctx.strokeStyle = 'rgba(240,232,210,0.9)'; ctx.lineWidth = 4;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-26, -52 + i * 9); ctx.lineTo(26, -46 + i * 9 + (i % 2 ? -6 : 4)); ctx.stroke(); }
        break;
      case 'sweater':
        ctx.fillStyle = '#c0392b'; ctx.fillRect(-25, -26, 50, 26);
        ctx.fillStyle = '#fff'; for (let x = -24; x < 26; x += 6) { ctx.beginPath(); ctx.moveTo(x, -20); ctx.lineTo(x + 3, -23); ctx.lineTo(x + 6, -20); ctx.lineTo(x + 3, -17); ctx.fill(); }
        ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(9, -4); ctx.lineTo(-1, -4); ctx.fill();
        star(ctx, 4, -14, 2.5, '#ffd32a');
        break;
      case 'candycane':
        ctx.fillStyle = '#f5f6fa'; ctx.fillRect(-25, -56, 50, 54);
        ctx.strokeStyle = '#e84118'; ctx.lineWidth = 5;
        for (let x = -60; x < 40; x += 12) { ctx.beginPath(); ctx.moveTo(x, -56); ctx.lineTo(x + 40, -2); ctx.stroke(); }
        break;
      case 'hawaii':
        ctx.fillStyle = '#00a8a8'; ctx.fillRect(-25, -28, 50, 28);
        for (const [x, y, c] of [[-12, -20, '#fd79a8'], [6, -12, '#ffeaa7'], [14, -24, '#ff7675'], [-4, -6, '#fdcb6e']]) for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; ellipse(ctx, x + Math.cos(b) * 3, y + Math.sin(b) * 3, 2.5, 2.5, c); }
        break;
      case 'stripes':
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(9,132,227,0.75)'; ctx.fillRect(-25, -30 + i * 4.5, 50, 4.5); }
        break;
      case 'lava':
        ctx.fillStyle = 'rgba(40,10,0,0.55)'; ctx.fillRect(-25, -56, 50, 54);
        ctx.strokeStyle = `rgba(255,${120 + Math.sin(t * 3) * 60},0,0.9)`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-18, -48); ctx.lineTo(-6, -36); ctx.lineTo(-12, -22); ctx.lineTo(2, -12);
        ctx.moveTo(-6, -36); ctx.lineTo(10, -40); ctx.lineTo(16, -26); ctx.moveTo(10, -40); ctx.lineTo(14, -52); ctx.stroke();
        break;
      case 'ice':
        ctx.fillStyle = 'rgba(200,240,255,0.45)'; ctx.fillRect(-25, -56, 50, 54);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5;
        for (const [x, y] of [[-10, -40], [10, -22], [8, -46]]) for (let k = 0; k < 3; k++) {
          const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 5, y - Math.sin(a) * 5); ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); ctx.stroke();
        }
        break;
      case 'galaxy': {
        const g = ctx.createRadialGradient(0, -30, 2, 0, -30, 26);
        g.addColorStop(0, 'rgba(162,155,254,0.6)'); g.addColorStop(1, 'rgba(20,10,60,0.75)');
        ctx.fillStyle = g; ctx.fillRect(-25, -56, 50, 54);
        for (let i = 0; i < 9; i++) ellipse(ctx, Math.sin(i * 7.3) * 18, -30 + Math.cos(i * 3.1) * 20, 1.2 + (Math.sin(t * 3 + i) + 1) * 0.6, 1.2 + (Math.sin(t * 3 + i) + 1) * 0.6, '#fff');
        break;
      }
    }
    ctx.restore();
  }

  function Draw_bell(ctx, x, y) { ellipse(ctx, x, y, 4.5, 4.5, '#ffd32a', '#111', 1.5); }

  // ------------------------------------------------------------------ hats
  function drawHat(ctx, h, dir, t, bodyColor) {
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111';
    const P = (fill) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
    switch (h.draw) {
      case 'cap':
        ctx.beginPath(); ctx.ellipse(0, -51, 18, 10, 0, Math.PI, 0); ctx.closePath(); P(h.c);
        ctx.beginPath(); ctx.ellipse(dir * 18, -51, 12, 3.5, 0, 0, Math.PI * 2); P(h.c2);
        break;
      case 'tophat':
        ctx.beginPath(); ctx.ellipse(0, -52, 20, 4, 0, 0, Math.PI * 2); P(h.c);
        ctx.beginPath(); ctx.rect(-12, -80, 24, 28); P(h.c);
        ctx.fillStyle = h.c2; ctx.fillRect(-12, -59, 24, 5);
        break;
      case 'crown':
        ctx.beginPath(); ctx.moveTo(-15, -50); ctx.lineTo(-17, -70); ctx.lineTo(-8, -61); ctx.lineTo(0, -73); ctx.lineTo(8, -61); ctx.lineTo(17, -70); ctx.lineTo(15, -50); ctx.closePath(); P(h.c);
        ellipse(ctx, 0, -57, 3, 3, h.c2);
        if (h.shine) for (let i = 0; i < 3; i++) {
          const k = (t * 0.8 + i / 3) % 1;
          star(ctx, -14 + i * 14, -74 + Math.sin(t * 3 + i) * 3, 3.5 * Math.sin(k * Math.PI), '#fff');
        }
        break;
      case 'beanie':
        ctx.beginPath(); ctx.ellipse(0, -50, 20, 15, 0, Math.PI, 0); ctx.closePath(); P(h.c);
        ctx.beginPath(); ctx.rect(-21, -53, 42, 6); P(h.c2);
        ellipse(ctx, 0, -66, 5, 5, h.c3, '#111', 2);
        break;
      case 'party':
        ctx.beginPath(); ctx.moveTo(-12, -50); ctx.lineTo(dir * 3, -84); ctx.lineTo(12, -50); ctx.closePath(); P(h.c);
        ctx.fillStyle = '#fff'; for (const [a, b] of [[-4, -58], [4, -66], [0, -74]]) { ctx.beginPath(); ctx.arc(a, b, 2.2, 0, 7); ctx.fill(); }
        ellipse(ctx, dir * 3, -85, 4, 4, '#e17055', '#111', 1.5);
        break;
      case 'halo':
        ctx.lineWidth = 4; ctx.strokeStyle = h.rainbow ? `hsl(${(t * 120) % 360}, 90%, 65%)` : '#ffeaa7';
        if (h.rainbow) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.ellipse(0, -72 + Math.sin(t * 3) * 2, 15, 5, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'horns':
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 8, -51); ctx.quadraticCurveTo(sx * 14, -62, sx * 18, -66); ctx.quadraticCurveTo(sx * 17, -56, sx * 15, -48); ctx.closePath(); P(h.c || '#d63031'); }
        break;
      case 'chef':
        ctx.beginPath(); ctx.rect(-14, -60, 28, 10); P('#fff');
        ctx.beginPath(); ctx.arc(-9, -66, 9, 0, 7); ctx.arc(9, -66, 9, 0, 7); P('#fff');
        ctx.beginPath(); ctx.arc(0, -72, 10, 0, 7); P('#fff');
        break;
      case 'cowboy':
        ctx.beginPath(); ctx.ellipse(0, -52, 30, 6, 0, 0, Math.PI * 2); P(h.c);
        ctx.beginPath(); ctx.moveTo(-14, -52); ctx.quadraticCurveTo(-15, -74, 0, -68); ctx.quadraticCurveTo(15, -74, 14, -52); ctx.closePath(); P(h.c);
        ctx.fillStyle = h.c2; ctx.fillRect(-14, -58, 28, 4);
        break;
      case 'flower':
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t; ellipse(ctx, dir * 12 + Math.cos(a) * 5, -52 + Math.sin(a) * 5, 4, 4, h.c, '#111', 1.2); }
        ellipse(ctx, dir * 12, -52, 3.5, 3.5, h.c2);
        break;
      case 'headphones':
        ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -36, 24, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-28, -42, 9, 16, 4); P(h.c);
        ctx.beginPath(); ctx.roundRect(19, -42, 9, 16, 4); P(h.c);
        break;
      case 'antlers':
        ctx.strokeStyle = h.c || '#8b5a2b'; ctx.lineWidth = 3.5;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 9, -51); ctx.lineTo(sx * 15, -72); ctx.moveTo(sx * 12, -62); ctx.lineTo(sx * 21, -66); ctx.moveTo(sx * 14, -69); ctx.lineTo(sx * 9, -76); ctx.stroke(); }
        break;
      case 'pirate':
        ctx.beginPath(); ctx.moveTo(-24, -52); ctx.quadraticCurveTo(0, -82, 24, -52); ctx.quadraticCurveTo(0, -58, -24, -52); P('#2d3436');
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -63, 3.5, 0, 7); ctx.fill();
        break;
      case 'wizard':
        ctx.beginPath(); ctx.ellipse(0, -52, 24, 5, 0, 0, Math.PI * 2); P(h.c);
        ctx.beginPath(); ctx.moveTo(-14, -53); ctx.quadraticCurveTo(-4, -76, -dir * 10, -92); ctx.quadraticCurveTo(6, -72, 14, -53); ctx.closePath(); P(h.c);
        star(ctx, 2, -64, 4, '#f9ca24');
        break;
      case 'bow':
        ctx.beginPath(); ctx.moveTo(dir * 10, -54); ctx.lineTo(dir * 2, -62); ctx.lineTo(dir * 2, -46); ctx.closePath(); P(h.c);
        ctx.beginPath(); ctx.moveTo(dir * 10, -54); ctx.lineTo(dir * 18, -62); ctx.lineTo(dir * 18, -46); ctx.closePath(); P(h.c);
        break;
      case 'helmet':
        ctx.globalAlpha *= 0.35; ellipse(ctx, 0, -34, 29, 30, '#dff9fb'); ctx.globalAlpha /= 0.35;
        ctx.beginPath(); ctx.ellipse(0, -34, 29, 30, 0, 0, Math.PI * 2); ctx.strokeStyle = '#c7ecee'; ctx.lineWidth = 3; ctx.stroke();
        ellipse(ctx, -dir * 12, -50, 6, 3, 'rgba(255,255,255,0.7)');
        break;
      case 'sprout':
        ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(0, -64); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#111';
        ctx.beginPath(); ctx.ellipse(-6, -66, 7, 4, -0.5, 0, Math.PI * 2); P('#2ecc71');
        ctx.beginPath(); ctx.ellipse(6, -66, 7, 4, 0.5, 0, Math.PI * 2); P('#2ecc71');
        break;
      case 'bandana':
        ctx.save(); clipBody(ctx); ctx.fillStyle = h.c; ctx.fillRect(-25, -50, 50, 7);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = -20; x < 22; x += 8) ctx.fillRect(x, -48, 2, 2); ctx.restore();
        ctx.fillStyle = h.c; ctx.beginPath(); ctx.moveTo(-dir * 20, -47); ctx.lineTo(-dir * 30, -52 + Math.sin(t * 6) * 2); ctx.lineTo(-dir * 29, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'catears': {
        const cc = h.body ? bodyColor.body : h.c;
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 6, -52); ctx.lineTo(sx * 15, -68); ctx.lineTo(sx * 20, -46); ctx.closePath(); P(cc);
          ctx.beginPath(); ctx.moveTo(sx * 10, -52); ctx.lineTo(sx * 15, -62); ctx.lineTo(sx * 17, -50); ctx.closePath(); ctx.fillStyle = '#fab1c4'; ctx.fill();
        }
        break;
      }
      case 'bunny':
        for (const sx of [-1, 1]) {
          ctx.save(); ctx.translate(sx * 9, -66); ctx.rotate(sx * 0.18 + Math.sin(t * 2 + sx) * 0.05);
          ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 17, 0, 0, Math.PI * 2); P(h.c);
          ellipse(ctx, 0, 1, 3, 12, '#fab1c4'); ctx.restore();
        }
        break;
      case 'propeller':
        ctx.beginPath(); ctx.ellipse(0, -50, 19, 13, 0, Math.PI, 0); ctx.closePath();
        { const g = ctx.createLinearGradient(-19, 0, 19, 0); ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db'].forEach((c, i) => { g.addColorStop(i / 4, c); g.addColorStop((i + 1) / 4 - 0.001, c); }); P(g); }
        ctx.beginPath(); ctx.moveTo(0, -63); ctx.lineTo(0, -70); ctx.stroke();
        { const w = Math.abs(Math.cos(t * 18)) * 16; ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.ellipse(0, -71, w + 1, 2.5, 0, 0, 7); ctx.fill(); ctx.stroke(); }
        break;
      case 'gradcap':
        ctx.beginPath(); ctx.ellipse(0, -52, 15, 7, 0, Math.PI, 0); P('#2d3436');
        ctx.beginPath(); ctx.moveTo(-24, -58); ctx.lineTo(0, -66); ctx.lineTo(24, -58); ctx.lineTo(0, -50); ctx.closePath(); P('#2d3436');
        ctx.strokeStyle = '#f9ca24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(dir * 18, -56); ctx.lineTo(dir * 18, -44 + Math.sin(t * 4)); ctx.stroke();
        break;
      case 'hardhat':
        ctx.beginPath(); ctx.ellipse(0, -51, 20, 15, 0, Math.PI, 0); ctx.closePath(); P(h.c);
        ctx.beginPath(); ctx.ellipse(0, -51, 26, 4, 0, 0, 7); P(h.c);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-3, -65, 6, 13);
        break;
      case 'police':
        ctx.beginPath(); ctx.moveTo(-20, -52); ctx.lineTo(-22, -66); ctx.quadraticCurveTo(0, -74, 22, -66); ctx.lineTo(20, -52); ctx.closePath(); P('#1e3a6e');
        ctx.beginPath(); ctx.ellipse(dir * 14, -51, 12, 3.5, 0, 0, 7); P('#111');
        star(ctx, 0, -60, 4.5, '#f9ca24');
        break;
      case 'santa':
        ctx.beginPath(); ctx.moveTo(-18, -52); ctx.quadraticCurveTo(-6, -84, -dir * 20, -76); ctx.lineTo(18, -52); ctx.closePath(); P('#d63031');
        ctx.beginPath(); ctx.roundRect(-21, -56, 42, 8, 4); P('#fff');
        ellipse(ctx, -dir * 21, -76, 5, 5, '#fff', '#111', 2);
        break;
      case 'viking':
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 16, -56); ctx.quadraticCurveTo(sx * 30, -60, sx * 28, -78); ctx.quadraticCurveTo(sx * 24, -66, sx * 12, -62); ctx.closePath(); P('#f5f0dc'); }
        ctx.beginPath(); ctx.ellipse(0, -51, 20, 16, 0, Math.PI, 0); ctx.closePath(); P('#95a5a6');
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-20, -55, 40, 4);
        break;
      case 'mushroom':
        ctx.beginPath(); ctx.ellipse(0, -54, 27, 17, 0, Math.PI, 0); ctx.closePath(); P('#e74c3c');
        for (const [x, y, r] of [[-12, -60, 4], [4, -66, 5], [14, -57, 3.5], [-2, -56, 3]]) ellipse(ctx, x, y, r, r, '#fff');
        break;
      case 'eggshell':
        ctx.beginPath(); ctx.moveTo(-18, -50);
        for (let i = 0; i <= 8; i++) ctx.lineTo(-18 + i * 4.5, -50 - (i % 2 ? 6 : 0));
        ctx.lineTo(18, -50); ctx.quadraticCurveTo(14, -74, 0, -74); ctx.quadraticCurveTo(-14, -74, -18, -50); P('#fdf6e3');
        break;
      case 'fez':
        ctx.beginPath(); ctx.moveTo(-13, -51); ctx.lineTo(-10, -70); ctx.lineTo(10, -70); ctx.lineTo(13, -51); ctx.closePath(); P(h.c);
        ctx.strokeStyle = '#f9ca24'; ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(dir * 10, -62 + Math.sin(t * 5) * 2); ctx.stroke();
        break;
      case 'toast':
        ctx.beginPath(); ctx.moveTo(-18, -50); ctx.lineTo(-18, -66); ctx.quadraticCurveTo(-20, -80, 0, -78); ctx.quadraticCurveTo(20, -80, 18, -66); ctx.lineTo(18, -50); ctx.closePath(); P('#b9770e');
        ctx.fillStyle = '#f8d48a'; ctx.beginPath(); ctx.roundRect(-14, -72, 28, 20, 5); ctx.fill();
        break;
      case 'plunger':
        ctx.fillStyle = '#c69c6d'; ctx.fillRect(-2.5, -86, 5, 30); ctx.strokeRect(-2.5, -86, 5, 30);
        ctx.beginPath(); ctx.ellipse(0, -52, 15, 10, 0, Math.PI, 0); ctx.closePath(); P('#c0392b');
        break;
      case 'cheese':
        ctx.beginPath(); ctx.moveTo(-18, -50); ctx.lineTo(18, -50); ctx.lineTo(10, -70); ctx.closePath(); P('#f6c23e');
        ellipse(ctx, 0, -56, 3, 2.5, '#d4a017'); ellipse(ctx, 9, -61, 2, 2, '#d4a017'); ellipse(ctx, -8, -53, 2, 1.5, '#d4a017');
        break;
      case 'beret':
        ctx.beginPath(); ctx.ellipse(-dir * 4, -54, 22, 8, -dir * 0.15, 0, 7); P(h.c);
        ctx.beginPath(); ctx.moveTo(-dir * 4, -62); ctx.lineTo(-dir * 3, -67); ctx.stroke();
        break;
      case 'bucket':
        ctx.beginPath(); ctx.moveTo(-26, -48); ctx.quadraticCurveTo(0, -56, 26, -48); ctx.lineTo(20, -54); ctx.lineTo(-20, -54); ctx.closePath(); P(h.c);
        ctx.beginPath(); ctx.moveTo(-15, -54); ctx.quadraticCurveTo(-14, -70, 0, -70); ctx.quadraticCurveTo(14, -70, 15, -54); ctx.closePath(); P(h.c);
        break;
      case 'sombrero':
        ctx.beginPath(); ctx.ellipse(0, -52, 40, 8, 0, 0, 7); P('#e1b12c');
        ctx.beginPath(); ctx.moveTo(-13, -53); ctx.quadraticCurveTo(-12, -80, 0, -80); ctx.quadraticCurveTo(12, -80, 13, -53); ctx.closePath(); P('#e1b12c');
        ctx.fillStyle = '#c23616'; ctx.fillRect(-13, -60, 26, 4); ctx.fillStyle = '#44bd32'; ctx.fillRect(-12, -64, 24, 3);
        break;
      case 'witch':
        ctx.beginPath(); ctx.ellipse(0, -52, 28, 6, 0, 0, 7); P('#2d3436');
        ctx.beginPath(); ctx.moveTo(-14, -53); ctx.lineTo(-4, -78); ctx.quadraticCurveTo(-dir * 8, -94, -dir * 16, -86); ctx.quadraticCurveTo(-dir * 4, -84, 8, -70); ctx.lineTo(14, -53); ctx.closePath(); P('#2d3436');
        ctx.fillStyle = '#8e44ad'; ctx.fillRect(-13, -60, 26, 5);
        break;
      case 'tiara':
        ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, -36, 19, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, -53); ctx.lineTo(0, -64); ctx.lineTo(8, -53); ctx.stroke();
        ellipse(ctx, 0, -58, 3, 3, '#74b9ff'); ellipse(ctx, -12, -51, 2, 2, '#fd79a8'); ellipse(ctx, 12, -51, 2, 2, '#fd79a8');
        break;
      case 'unicorn': {
        ctx.beginPath(); ctx.moveTo(dir * 6 - 6, -50); ctx.lineTo(dir * 10, -78); ctx.lineTo(dir * 6 + 6, -50); ctx.closePath();
        const g = ctx.createLinearGradient(0, -50, 0, -78); g.addColorStop(0, '#fdcb6e'); g.addColorStop(1, '#fd79a8'); P(g);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
        for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dir * 6 - 6 + i * 1.5, -50 - i * 7); ctx.lineTo(dir * 6 + 6 - i * 1.5, -54 - i * 7); ctx.stroke(); }
        break;
      }
      case 'chick': {
        const hop = Math.abs(Math.sin(t * 4)) * 2;
        ellipse(ctx, 0, -60 - hop, 10, 9, '#ffe066', '#111', 2);
        ellipse(ctx, dir * 4, -62 - hop, 1.6, 1.8, '#111');
        ctx.fillStyle = '#e17055'; ctx.beginPath(); ctx.moveTo(dir * 9, -61 - hop); ctx.lineTo(dir * 15, -59 - hop); ctx.lineTo(dir * 9, -57 - hop); ctx.fill();
        ctx.strokeStyle = '#ffd32a'; ctx.beginPath(); ctx.moveTo(-2, -69 - hop); ctx.lineTo(0, -73 - hop); ctx.lineTo(2, -69 - hop); ctx.stroke();
        break;
      }
      case 'laurel':
        for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
          const a = Math.PI * 1.5 + sx * (0.25 + i * 0.22);
          ctx.save(); ctx.translate(Math.cos(a) * 21, -34 + Math.sin(a) * 21); ctx.rotate(a + sx * 0.6);
          ellipse(ctx, 0, 0, 5, 2.6, '#6ab04c', '#2d5a1b', 1.2); ctx.restore();
        }
        break;
      case 'flame':
        for (let i = 0; i < 3; i++) {
          const fl = Math.sin(t * 14 + i * 2) * 3;
          ctx.fillStyle = (h.c || ['#e84118', '#fbc531', '#fff6a3'])[i];
          const w = 14 - i * 4, hgt = 30 - i * 8;
          ctx.beginPath(); ctx.moveTo(-w, -50); ctx.quadraticCurveTo(-w, -50 - hgt * 0.6, fl, -50 - hgt); ctx.quadraticCurveTo(w, -50 - hgt * 0.6, w, -50); ctx.closePath(); ctx.fill();
        }
        break;
      case 'rainbow':
        ctx.lineWidth = 3.5;
        RAINBOW.forEach((r, i) => { ctx.strokeStyle = r; ctx.beginPath(); ctx.arc(0, -52, 30 - i * 3.5, Math.PI, 0); ctx.stroke(); });
        ellipse(ctx, -30, -54, 7, 5, '#fff'); ellipse(ctx, 30, -54, 7, 5, '#fff');
        break;
      case 'orbit': {
        if (h.sunOnly) {
          for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t; ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, -70 + Math.sin(a) * 16); ctx.lineTo(Math.cos(a) * 23, -70 + Math.sin(a) * 23); ctx.stroke(); }
          ctx.shadowColor = '#ffd32a'; ctx.shadowBlur = 16;
          ellipse(ctx, 0, -70, 12, 12, '#ffd32a', '#e1a32a', 2);
          ctx.shadowBlur = 0;
          ellipse(ctx, -4, -72, 1.5, 1.5, '#111'); ellipse(ctx, 4, -72, 1.5, 1.5, '#111');
          break;
        }
        const planets = [['#f9ca24', 7, 0, 26, 1], ['#74b9ff', 4, 1.6, 34, 1.7], ['#ff7675', 3.5, 3.6, 42, 1.2], ['#55efc4', 3, 5, 30, 2.3]];
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        for (const [, , , r] of planets) { ctx.beginPath(); ctx.ellipse(0, -66, r, r * 0.3, 0, 0, 7); ctx.stroke(); }
        for (const [c, size, a0, r, sp] of planets) {
          const a = a0 + t * sp;
          const x = Math.cos(a) * r, y = -66 + Math.sin(a) * r * 0.3;
          ellipse(ctx, x, y, size, size, c, '#111', 1.5);
        }
        ctx.shadowColor = '#f9ca24'; ctx.shadowBlur = 14;
        ellipse(ctx, 0, -66, 8, 8, '#ffd32a', '#111', 1.5);
        break;
      }
      case 'pumpkin': {
        ctx.beginPath(); ctx.ellipse(0, -60, 26, 19, 0, 0, 7); P('#ff7b1c');
        ctx.strokeStyle = 'rgba(120,50,0,0.6)'; ctx.lineWidth = 2;
        for (const x of [-9, 0, 9]) { ctx.beginPath(); ctx.ellipse(x, -60, 6, 18, 0, 0, 7); ctx.stroke(); }
        ctx.fillStyle = '#ffe066';
        ctx.beginPath(); ctx.moveTo(dir * 2 - 13, -64); ctx.lineTo(dir * 2 - 7, -70); ctx.lineTo(dir * 2 - 3, -63); ctx.fill();
        ctx.beginPath(); ctx.moveTo(dir * 2 + 3, -63); ctx.lineTo(dir * 2 + 7, -70); ctx.lineTo(dir * 2 + 13, -64); ctx.fill();
        ctx.beginPath(); ctx.moveTo(dir * 2 - 12, -55); for (let i = 0; i <= 6; i++) ctx.lineTo(dir * 2 - 12 + i * 4, -55 + (i % 2 ? 4 : 0)); ctx.lineTo(dir * 2 + 12, -51); ctx.lineTo(dir * 2 - 12, -51); ctx.fill();
        ctx.fillStyle = '#2d6a1f'; ctx.fillRect(-2, -84, 5, 7);
        break;
      }
      case 'candycorn':
        ctx.save(); ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(dir * 2, -84); ctx.lineTo(14, -50); ctx.closePath(); ctx.clip();
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(-20, -62, 40, 14); ctx.fillStyle = '#ff7b1c'; ctx.fillRect(-20, -73, 40, 11); ctx.fillStyle = '#fff'; ctx.fillRect(-20, -90, 40, 17);
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(dir * 2, -84); ctx.lineTo(14, -50); ctx.closePath(); ctx.stroke();
        break;
      case 'bathat':
        for (const sx of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(sx * 6, -52); ctx.lineTo(sx * 12, -72); ctx.lineTo(sx * 22, -62); ctx.lineTo(sx * 30, -66); ctx.lineTo(sx * 26, -52); ctx.closePath(); P('#2d1b3d');
        }
        break;
      case 'elf':
        ctx.beginPath(); ctx.moveTo(-17, -52); ctx.quadraticCurveTo(-6, -70, -dir * 26, -86); ctx.quadraticCurveTo(8, -72, 17, -52); ctx.closePath(); P('#1e9e4a');
        ctx.beginPath(); ctx.roundRect(-19, -56, 38, 8, 4); P('#d63031');
        Draw_bell(ctx, -dir * 26, -86);
        break;
      case 'reindeer':
        ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3.5;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 9, -51); ctx.lineTo(sx * 15, -72); ctx.moveTo(sx * 12, -62); ctx.lineTo(sx * 21, -66); ctx.moveTo(sx * 14, -69); ctx.lineTo(sx * 9, -76); ctx.stroke(); }
        ctx.lineWidth = 2; ctx.strokeStyle = '#111';
        ctx.beginPath(); ctx.arc(dir * 18, -26, 5, 0, 7); ctx.fillStyle = Math.sin(t * 4) > -0.3 ? '#ff3b3b' : '#c0392b'; ctx.fill(); ctx.stroke();
        break;
      case 'startopper':
        ctx.shadowColor = '#ffe066'; ctx.shadowBlur = 14 + Math.sin(t * 4) * 6;
        star(ctx, 0, -66, 14, '#ffd32a');
        ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.stroke();
        break;
      case 'sunhat':
        ctx.beginPath(); ctx.ellipse(0, -52, 36, 8, 0, 0, 7); P('#f6e3a1');
        ctx.beginPath(); ctx.ellipse(0, -55, 16, 13, 0, Math.PI, 0); ctx.closePath(); P('#f6e3a1');
        ctx.fillStyle = '#ff6b81'; ctx.fillRect(-16, -58, 32, 5);
        ellipse(ctx, dir * 14, -58, 4, 4, '#ffd32a', '#111', 1.5);
        break;
      case 'watermelon':
        ctx.beginPath(); ctx.ellipse(0, -52, 20, 18, 0, Math.PI, 0); ctx.closePath(); P('#2ecc71');
        ctx.beginPath(); ctx.ellipse(0, -52, 16, 14, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ff6b81'; ctx.fill();
        ctx.fillStyle = '#111'; for (const [x, y] of [[-8, -57], [0, -62], [8, -57], [-3, -55], [4, -55]]) { ctx.beginPath(); ctx.ellipse(x, y, 1.4, 2.4, 0, 0, 7); ctx.fill(); }
        break;
      case 'flowercrown':
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (1.15 + i * 0.12), x = Math.cos(a) * 21, y = -36 + Math.sin(a) * 21;
          for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; ellipse(ctx, x + Math.cos(b) * 3, y + Math.sin(b) * 3, 2.6, 2.6, ['#fd79a8', '#ffeaa7', '#a29bfe', '#ff7675'][i % 4]); }
          ellipse(ctx, x, y, 1.8, 1.8, '#fdcb6e');
        }
        break;
      case 'snorkel':
        ctx.fillStyle = 'rgba(116,185,255,0.45)'; ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(dir * 5 - 19, -42, 38, 17, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(-dir * 20 - 2, -70, 5, 34); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.strokeRect(-dir * 20 - 2, -70, 5, 34);
        ctx.fillStyle = '#ff7675'; ctx.fillRect(-dir * 20 - 3, -72, 7, 5);
        break;
      case 'raincloud': {
        const y = -84 + Math.sin(t * 2) * 2;
        ctx.fillStyle = '#9aa5b1';
        for (const [x, yy, r] of [[-10, 0, 8], [0, -5, 10], [11, 0, 8]]) { ctx.beginPath(); ctx.arc(x, y + yy, r, 0, 7); ctx.fill(); }
        ctx.strokeStyle = '#74b9ff'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) { const k = ((t * 1.6 + i * 0.25) % 1); ctx.beginPath(); ctx.moveTo(-10 + i * 7, y + 8 + k * 14); ctx.lineTo(-11 + i * 7, y + 12 + k * 14); ctx.stroke(); }
        break;
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ pets
  function pet(ctx, x, y, id, dir, t, s, moving, ownerColor) {
    const p = item('pet', id);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * 0.6, s * 0.6);
    const hop = moving ? Math.abs(Math.sin(t * 12)) * 6 : 0;
    ellipse(ctx, 0, 0, 14, 4, 'rgba(0,0,0,0.2)');
    ctx.translate(0, -hop);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#111';
    const eyes = (y0, gap, cx = 0) => { ellipse(ctx, cx + dir * 3 - gap, y0, 2.5, 3, '#111'); ellipse(ctx, cx + dir * 3 + gap, y0, 2.5, 3, '#111'); };
    const fly = (amp, base) => ctx.translate(0, Math.sin(t * 3) * amp + base);
    switch (p.draw) {
      case 'drone': {
        fly(4, -26);
        ctx.beginPath(); ctx.roundRect(-14, -8, 28, 16, 6); ctx.fillStyle = '#b2bec3'; ctx.fill(); ctx.stroke();
        ellipse(ctx, dir * 4, 0, 5, 5, '#ff7675', '#111', 2);
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.fillRect(-22, -12, 14 * Math.abs(Math.cos(t * 30)), 2); ctx.fillRect(8, -12, 14 * Math.abs(Math.cos(t * 30)), 2);
        break;
      }
      case 'kitty':
        ellipse(ctx, 0, -14, 15, 13, p.c, '#111');
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 12, -22); ctx.lineTo(sx * 10, -34); ctx.lineTo(sx * 3, -26); ctx.closePath(); ctx.fillStyle = p.c; ctx.fill(); ctx.stroke(); }
        { const eye = p.eye || (p.c === '#3d3d3d' ? '#f9ca24' : '#111'); ellipse(ctx, dir * 3 - 5, -15, 2.5, 3, eye); ellipse(ctx, dir * 3 + 5, -15, 2.5, 3, eye); }
        break;
      case 'puppy':
        ellipse(ctx, 0, -14, 15, 13, '#d4a373', '#111');
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 14, -14, 5, 10, sx * 0.3, 0, 7); ctx.fillStyle = '#8b5e34'; ctx.fill(); ctx.stroke(); }
        eyes(-17, 5); ellipse(ctx, dir * 4, -9, 3, 2.2, '#111');
        break;
      case 'bunnypet':
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 6, -34, 4, 11, sx * 0.15, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
        ellipse(ctx, 0, -13, 14, 13, '#fff', '#111'); eyes(-15, 5); ellipse(ctx, dir * 4, -10, 2, 1.5, '#fd79a8');
        break;
      case 'slime':
        ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-16, -26, 0, -26); ctx.quadraticCurveTo(16, -26, 16, 0); ctx.closePath();
        ctx.fillStyle = p.c; ctx.fill(); ctx.stroke(); eyes(-13, 5);
        break;
      case 'ufo': {
        fly(4, -24);
        ellipse(ctx, 0, -6, 9, 8, 'rgba(129,236,236,0.8)', '#111', 2);
        ellipse(ctx, 0, 0, 18, 6, '#a4b0be', '#111', 2);
        for (let i = -1; i <= 1; i++) ellipse(ctx, i * 9, 1, 2, 2, (Math.floor(t * 4) + i) % 2 ? '#ffeaa7' : '#fd79a8');
        break;
      }
      case 'duck':
        ellipse(ctx, 0, -12, 14, 11, '#ffeaa7', '#111');
        ellipse(ctx, dir * 8, -24, 9, 8, '#ffeaa7', '#111');
        ctx.beginPath(); ctx.moveTo(dir * 15, -25); ctx.lineTo(dir * 23, -22); ctx.lineTo(dir * 15, -20); ctx.closePath(); ctx.fillStyle = '#e17055'; ctx.fill(); ctx.stroke();
        ellipse(ctx, dir * 10, -26, 1.8, 2, '#111');
        break;
      case 'robot':
        ctx.beginPath(); ctx.roundRect(-12, -26, 24, 24, 4); ctx.fillStyle = '#74b9ff'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2d3436'; ctx.fillRect(-8, -21, 16, 8);
        ellipse(ctx, dir * 2 - 4, -17, 2, 2, '#55efc4'); ellipse(ctx, dir * 2 + 4, -17, 2, 2, '#55efc4');
        ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -32); ctx.stroke(); ellipse(ctx, 0, -33, 2.5, 2.5, '#ff7675');
        break;
      case 'rock':
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-12, -12); ctx.lineTo(-2, -18); ctx.lineTo(10, -14); ctx.lineTo(14, 0); ctx.closePath(); ctx.fillStyle = '#95a5a6'; ctx.fill(); ctx.stroke();
        eyes(-9, 4);
        break;
      case 'snail':
        ellipse(ctx, 0, -3, 16, 5, '#a3cb38', '#111', 2);
        ctx.beginPath(); ctx.arc(-dir * 2, -14, 10, 0, 7); ctx.fillStyle = '#cd6133'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); for (let a = 0; a < 10; a += 0.3) ctx.lineTo(-dir * 2 + Math.cos(a) * a * 0.8, -14 + Math.sin(a) * a * 0.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dir * 12, -5); ctx.lineTo(dir * 15, -16); ctx.stroke(); ellipse(ctx, dir * 15, -17, 2.5, 2.5, '#111');
        break;
      case 'bee': {
        fly(5, -28);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.ellipse(-4, -10, 6, 9 * Math.abs(Math.sin(t * 40)) + 2, -0.4, 0, 7); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, 7); ctx.fillStyle = '#f9ca24'; ctx.fill(); ctx.clip();
        ctx.fillStyle = '#111'; ctx.fillRect(-4, -10, 4, 20); ctx.fillRect(4, -10, 4, 20); ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, 7); ctx.stroke(); ellipse(ctx, dir * 8, -2, 1.8, 2, '#111');
        break;
      }
      case 'cactus':
        ctx.fillStyle = '#c0703c'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-10, -10); ctx.lineTo(10, -10); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-7, -38, 14, 30, 7); ctx.fillStyle = '#27ae60'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(5, -30, 10, 6, 3); ctx.roundRect(11, -38, 5, 12, 3); ctx.fill(); ctx.stroke();
        eyes(-28, 3);
        ellipse(ctx, 0, -40, 3, 3, '#fd79a8');
        break;
      case 'fishbowl':
        ellipse(ctx, 0, -16, 16, 15, 'rgba(116,185,255,0.35)', '#dfe6e9', 2.5);
        { const fx = Math.sin(t * 2) * 5; ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.ellipse(fx, -14, 6, 4, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(fx - Math.sign(Math.cos(t * 2) || 1) * 5, -14); ctx.lineTo(fx - Math.sign(Math.cos(t * 2) || 1) * 10, -18); ctx.lineTo(fx - Math.sign(Math.cos(t * 2) || 1) * 10, -10); ctx.fill(); }
        break;
      case 'penguin':
        ellipse(ctx, 0, -16, 13, 16, '#2d3436', '#111'); ellipse(ctx, dir * 2, -13, 8, 11, '#fff');
        ellipse(ctx, dir * 2 - 4, -22, 2, 2.2, '#111'); ellipse(ctx, dir * 2 + 4, -22, 2, 2.2, '#111');
        ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.moveTo(dir * 3 - 3, -18); ctx.lineTo(dir * 10, -17); ctx.lineTo(dir * 3 - 3, -15); ctx.fill();
        break;
      case 'ghostpet':
        fly(4, -14);
        ctx.globalAlpha *= 0.8;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.bezierCurveTo(-12, -28, 12, -28, 12, 0);
        for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(12 - i * 6 - 3, i % 2 ? -5 : 4, 12 - (i + 1) * 6, 0);
        ctx.fillStyle = '#f5f6fa'; ctx.fill(); ctx.stroke(); eyes(-14, 4);
        break;
      case 'starpet':
        fly(3, -20);
        ctx.rotate(Math.sin(t * 2) * 0.2);
        star(ctx, 0, -6, 16, '#fdcb6e'); ctx.lineWidth = 2; ctx.stroke(); eyes(-7, 4);
        break;
      case 'miniblob': {
        const c = col(ownerColor);
        ellipse(ctx, -5, -2, 5, 4, c.shade, '#111', 2); ellipse(ctx, 5, -2, 5, 4, c.shade, '#111', 2);
        ellipse(ctx, 0, -16, 14, 14, c.body, '#111'); eyes(-18, 4);
        break;
      }
      case 'bat': {
        fly(5, -26);
        const f = Math.sin(t * 12) * 8;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 6, -2); ctx.quadraticCurveTo(sx * 16, -12 - f, sx * 26, -4 - f); ctx.quadraticCurveTo(sx * 18, 0, sx * 6, 4); ctx.fillStyle = '#2d1b3d'; ctx.fill(); ctx.stroke(); }
        ellipse(ctx, 0, 0, 9, 8, '#3d2a4f', '#111', 2);
        ellipse(ctx, dir * 2 - 3, -1, 1.6, 1.8, '#ff4757'); ellipse(ctx, dir * 2 + 3, -1, 1.6, 1.8, '#ff4757');
        break;
      }
      case 'pumpkinpet':
        ellipse(ctx, 0, -12, 16, 12, '#ff7b1c', '#111');
        ctx.strokeStyle = 'rgba(120,50,0,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, -12, 6, 12, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(dir * 3 - 8, -16); ctx.lineTo(dir * 3 - 4, -20); ctx.lineTo(dir * 3 - 1, -15); ctx.moveTo(dir * 3 + 1, -15); ctx.lineTo(dir * 3 + 4, -20); ctx.lineTo(dir * 3 + 8, -16); ctx.fill();
        ctx.beginPath(); ctx.ellipse(dir * 3, -8, 6, 2.5, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#2d6a1f'; ctx.fillRect(-2, -28, 4, 5);
        break;
      case 'gingerbread':
        ctx.fillStyle = '#b5651d'; ctx.strokeStyle = '#111';
        ctx.beginPath(); ctx.arc(0, -26, 8, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-8, -19, 16, 17, 5); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = '#b5651d';
        ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(-14, -9 + (moving ? Math.sin(t * 12) * 3 : 0)); ctx.moveTo(8, -15); ctx.lineTo(14, -9 - (moving ? Math.sin(t * 12) * 3 : 0)); ctx.moveTo(-4, -3); ctx.lineTo(-6, 2); ctx.moveTo(4, -3); ctx.lineTo(6, 2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(6, -10); ctx.stroke();
        ellipse(ctx, dir * 2 - 3, -27, 1.5, 1.5, '#fff'); ellipse(ctx, dir * 2 + 3, -27, 1.5, 1.5, '#fff');
        ellipse(ctx, 0, -14, 1.8, 1.8, '#ff4757'); ellipse(ctx, 0, -7, 1.8, 1.8, '#2ed573');
        break;
      case 'snowmanpet':
        ellipse(ctx, 0, -8, 12, 10, '#fff', '#111', 2); ellipse(ctx, 0, -24, 9, 8, '#fff', '#111', 2);
        ellipse(ctx, dir * 2 - 3, -26, 1.5, 1.5, '#111'); ellipse(ctx, dir * 2 + 3, -26, 1.5, 1.5, '#111');
        ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.moveTo(dir * 3, -23); ctx.lineTo(dir * 12, -22); ctx.lineTo(dir * 3, -21); ctx.fill();
        ctx.fillStyle = '#c0392b'; ctx.fillRect(-9, -18, 18, 3);
        ctx.fillStyle = '#2d3436'; ctx.fillRect(-7, -38, 14, 8); ctx.fillRect(-10, -31, 20, 2);
        break;
      case 'crab': {
        const sc = moving ? Math.sin(t * 16) * 2 : 0;
        ellipse(ctx, 0, -9, 15, 9, '#ff6b4a', '#111', 2);
        for (const sx of [-1, 1]) {
          ellipse(ctx, sx * 20, -16 + sc * sx, 6, 5, '#ff6b4a', '#111', 1.5);
          ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(sx * 9, -5 + k * 2); ctx.lineTo(sx * 17, 0 + k * 2); } ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(-4, -17); ctx.lineTo(-5, -23); ctx.moveTo(4, -17); ctx.lineTo(5, -23); ctx.stroke();
        ellipse(ctx, -5, -24, 2.2, 2.2, '#fff', '#111', 1); ellipse(ctx, 5, -24, 2.2, 2.2, '#fff', '#111', 1);
        break;
      }
      case 'dolphin': {
        fly(4, -14);
        ctx.save(); ctx.rotate(Math.sin(t * 3) * 0.15 * dir);
        ctx.beginPath(); ctx.moveTo(-dir * 20, -2); ctx.quadraticCurveTo(-dir * 4, -18, dir * 16, -8); ctx.quadraticCurveTo(dir * 22, -4, dir * 16, 0); ctx.quadraticCurveTo(0, 6, -dir * 20, -2); ctx.fillStyle = '#74b9ff'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-dir * 4, -20); ctx.lineTo(-dir * 6, -10); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-dir * 20, -2); ctx.lineTo(-dir * 28, -8); ctx.lineTo(-dir * 26, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ellipse(ctx, dir * 10, -8, 1.6, 1.6, '#111');
        ctx.restore();
        break;
      }
      case 'beachball': {
        const bounce = Math.abs(Math.sin(t * 5)) * 8;
        ctx.translate(0, -bounce); ctx.rotate(t * 3 * dir);
        const cols = ['#ff4757', '#fff', '#1e90ff', '#fff', '#ffd32a', '#fff'];
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, -12); ctx.arc(0, -12, 12, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fillStyle = cols[i]; ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, -12, 12, 0, 7); ctx.stroke();
        break;
      }
      case 'blackhole': {
        fly(3, -22);
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = `rgba(${[162, 255, 116][i]},${[155, 159, 185][i]},${[254, 67, 255][i]},0.8)`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, 0, 18 - i * 3, 6 - i, t * (1 + i * 0.4), 0, 7); ctx.stroke();
        }
        ellipse(ctx, 0, 0, 7, 7, '#000', '#6c5ce7', 2);
        break;
      }
      case 'unicornpet': {
        ellipse(ctx, 0, -12, 15, 11, '#fff', '#111');
        ellipse(ctx, dir * 11, -24, 8, 8, '#fff', '#111');
        ctx.beginPath(); ctx.moveTo(dir * 11 - 2, -31); ctx.lineTo(dir * 14, -42); ctx.lineTo(dir * 11 + 3, -31); ctx.closePath(); ctx.fillStyle = '#f9ca24'; ctx.fill(); ctx.stroke();
        RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-dir * 4 - 2 - dir * i * 1.5, -28 + i * 2.5, 3, 3); });
        ctx.strokeStyle = `hsl(${(t * 120) % 360}, 80%, 60%)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-dir * 14, -14); ctx.quadraticCurveTo(-dir * 24, -10 + Math.sin(t * 5) * 4, -dir * 22, -2); ctx.stroke();
        ellipse(ctx, dir * 14, -25, 1.8, 2, '#111');
        break;
      }
      case 'phoenix': {
        fly(4, -22);
        const flap = Math.sin(t * 9) * 8;
        for (const side of [-1, 1]) {
          ctx.fillStyle = side < 0 ? '#ff6b00' : '#ffb300';
          ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(side * 22, -16 - flap); ctx.lineTo(side * 14, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = ['#ff4d00', '#ff9f1a', '#ffe066'][i];
          ctx.beginPath(); ctx.moveTo(-dir * 6, 0); ctx.quadraticCurveTo(-dir * (16 + i * 3), 6 + i * 4, -dir * (20 + i * 4), 14 + i * 3 + Math.sin(t * 6 + i) * 2); ctx.lineTo(-dir * 4, 2); ctx.fill();
        }
        ellipse(ctx, 0, -4, 9, 8, '#ff7f00', '#111');
        ctx.fillStyle = '#f9ca24'; ctx.beginPath(); ctx.moveTo(dir * 7, -6); ctx.lineTo(dir * 13, -4); ctx.lineTo(dir * 7, -2); ctx.fill();
        ellipse(ctx, dir * 3, -7, 1.6, 1.8, '#111');
        ctx.fillStyle = '#ffe066'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -11); ctx.lineTo(i * 4, -17 + Math.abs(i) * 2); ctx.lineTo(i * 3 + 2, -11); ctx.fill(); }
        break;
      }
      case 'dragon': {
        fly(3, -16);
        const flap = Math.sin(t * 8) * 6;
        const dc = p.c || '#6ab04c';
        ctx.fillStyle = dc;
        ctx.beginPath(); ctx.moveTo(-dir * 4, -18); ctx.lineTo(-dir * 20, -30 - flap); ctx.lineTo(-dir * 14, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ellipse(ctx, 0, -10, 14, 11, dc, '#111');
        ellipse(ctx, dir * 10, -22, 9, 8, dc, '#111');
        ellipse(ctx, dir * 13, -24, 2, 2.4, '#111');
        ctx.fillStyle = '#f9ca24'; ctx.beginPath(); ctx.moveTo(dir * 6, -29); ctx.lineTo(dir * 4, -36); ctx.lineTo(dir * 10, -30); ctx.fill();
        if (Math.sin(t * 1.5) > 0.85) { ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.moveTo(dir * 18, -21); ctx.lineTo(dir * 30, -25); ctx.lineTo(dir * 30, -17); ctx.fill(); }
        break;
      }
    }
    ctx.restore();
  }

  // A fallen crewmate: the blob lying on its side with X eyes.
  function body(ctx, x, y, colorId, alpha) {
    const c = col(colorId);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ellipse(ctx, 0, 2, 32, 8, 'rgba(0,0,0,0.3)');
    ellipse(ctx, 22, -2, 7, 5, c.shade, '#111', 2.5);
    ellipse(ctx, 26, 4, 7, 5, c.shade, '#111', 2.5);
    ctx.beginPath(); ctx.ellipse(-2, -10, 26, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.body; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.stroke();
    ellipse(ctx, -2, -4, 20, 6, c.shade);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5;
    for (const sx of [-14, -2]) {
      ctx.beginPath(); ctx.moveTo(sx - 3, -17); ctx.lineTo(sx + 3, -11); ctx.moveTo(sx + 3, -17); ctx.lineTo(sx - 3, -11); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-28, -14); ctx.quadraticCurveTo(-36, -18, -40, -12); ctx.stroke();
    ellipse(ctx, -41, -11, 3.5, 3.5, c.body, '#111', 2);
    ctx.restore();
  }

  function nameTag(ctx, x, y, text, color, scale) {
    ctx.save();
    ctx.font = `bold ${Math.round(15 * (scale || 1))}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Render a standalone portrait to a small canvas (used in menus, meetings, lists)
  function portrait(canvas, prof, opts = {}) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (opts.petOnly) {
      pet(ctx, w / 2, h * 0.82, prof.pet, 1, opts.phase || 0, Math.min(w, h) / 40, false, prof.color);
      return;
    }
    const s = Math.min(w, h) / (opts.pet ? 110 : 95);
    if (opts.dead) body(ctx, w / 2, h * 0.7, prof.color);
    else character(ctx, opts.pet ? w * 0.6 : w / 2, h * 0.88, { ...prof, dir: 1, scale: s, phase: opts.phase || 0, noPet: !opts.pet, ghost: opts.ghost });
  }

  return { character, body, nameTag, portrait, pet, col, star, ellipse };
})();
