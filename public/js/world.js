// Map pre-rendering, field-of-view, and world drawing.
const World = (() => {
  const cache = {};

  function prerender(map) {
    if (cache[map.id]) return cache[map.id];
    const pad = 60;
    const cv = document.createElement('canvas');
    cv.width = map.width + pad * 2;
    cv.height = map.height + pad * 2;
    const ctx = cv.getContext('2d');
    ctx.translate(pad, pad);
    // walls: thick strokes of every walkable rect, then floors drawn on top
    ctx.lineJoin = 'round';
    for (const r of map.rects) {
      ctx.fillStyle = '#10141f';
      ctx.fillRect(r.x - 30, r.y - 30, r.w + 60, r.h + 60);
    }
    for (const r of map.rects) {
      ctx.fillStyle = '#2a3247';
      ctx.fillRect(r.x - 18, r.y - 38, r.w + 36, r.h + 52);
    }
    for (const r of map.rects) {
      ctx.fillStyle = '#56607a';
      ctx.fillRect(r.x - 6, r.y - 30, r.w + 12, 30);
    }
    // floors
    for (const r of map.corridors) {
      ctx.fillStyle = '#3d4353';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    for (const r of map.rooms) {
      ctx.fillStyle = r.floor;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // floor tiles
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      for (let x = r.x; x <= r.x + r.w; x += 50) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x, r.y + r.h); ctx.stroke(); }
      for (let y = r.y; y <= r.y + r.h; y += 50) { ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); }
      // wall top band
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(r.x, r.y, r.w, 10);
    }
    for (const r of map.corridors) {
      ctx.strokeStyle = 'rgba(255,220,120,0.12)';
      ctx.setLineDash([18, 14]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (r.w > r.h) { ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); }
      else { ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h); }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // room labels
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
    for (const r of map.rooms) {
      if (!r.name) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillText(r.name.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2 + 10);
    }
    for (const p of map.props) drawProp(ctx, p);
    // static station consoles
    for (const id in map.stations) {
      const s = map.stations[id];
      if (s.console === 'emergency') continue;
      ctx.fillStyle = '#20263a';
      ctx.strokeStyle = '#0b0e16';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(s.x - 18, s.y - 16, 36, 28, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = s.sab ? '#5a2330' : s.console ? '#1d4a5c' : '#24563a';
      ctx.fillRect(s.x - 13, s.y - 12, 26, 14);
    }
    // vents
    for (const v of map.vents) {
      ctx.fillStyle = '#222833';
      ctx.strokeStyle = '#0b0e16';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(v.x - 26, v.y - 15, 52, 30, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4b5568';
      ctx.lineWidth = 3;
      for (let i = -16; i <= 16; i += 8) { ctx.beginPath(); ctx.moveTo(v.x + i, v.y - 10); ctx.lineTo(v.x + i, v.y + 10); ctx.stroke(); }
    }
    cache[map.id] = { canvas: cv, pad };
    return cache[map.id];
  }

  function drawProp(ctx, p) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0e16';
    switch (p.type) {
      case 'table':
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, p.r, p.r * 0.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a93a8'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#a9b1c4'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, p.r * 0.8, p.r * 0.45, 0, 0, 7); ctx.fill();
        break;
      case 'button':
        ctx.fillStyle = '#6d7488'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.65, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9aa1b5'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, p.r * 0.8, p.r * 0.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(180,220,255,0.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 22, 28, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 18, 16, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
        break;
      case 'reactor':
        for (let i = 3; i > 0; i--) { ctx.fillStyle = `rgba(80,200,255,${0.08 * i})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + i * 18, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#2b3b55'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#5fd3ff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.22, 0, 7); ctx.fill();
        break;
      case 'bed':
        ctx.fillStyle = '#c8d3e0'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillRect(p.x + p.w / 2 - 20, p.y - p.h / 2 + 5, 14, p.h - 10);
        break;
      case 'crate':
        ctx.fillStyle = '#8c6a3f'; ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h); ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
        ctx.strokeStyle = '#5e4526'; ctx.beginPath(); ctx.moveTo(p.x - p.w / 2, p.y - p.h / 2); ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2); ctx.moveTo(p.x + p.w / 2, p.y - p.h / 2); ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2); ctx.stroke();
        break;
      case 'engine':
        ctx.fillStyle = '#5b6170'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.ellipse(p.x - p.w / 2, p.y, 14, p.h / 2 - 8, 0, 0, 7); ctx.fill();
        break;
      case 'plants':
        for (let i = 0; i < 6; i++) {
          const x = p.x - p.w / 2 + 20 + i * (p.w - 40) / 5;
          ctx.fillStyle = '#6b4f2a'; ctx.fillRect(x - 12, p.y, 24, 20); ctx.strokeRect(x - 12, p.y, 24, 20);
          ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.ellipse(x, p.y - 8, 14, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
        }
        break;
      case 'console':
      case 'monitors':
        ctx.fillStyle = '#20263a'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 6); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#1e90ff' : '#2ed573'; ctx.fillRect(p.x - p.w / 2 + 10 + i * (p.w - 20) / 4, p.y - p.h / 2 + 5, (p.w - 20) / 4 - 6, p.h - 10); }
        break;
      case 'admintable':
        ctx.fillStyle = '#26324a'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(46,213,115,0.4)'; ctx.fillRect(p.x - p.w / 2 + 10, p.y - p.h / 2 + 10, p.w - 20, p.h - 20);
        break;
      case 'labtable':
        ctx.fillStyle = '#dfe6e9'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#ff7675', '#74b9ff', '#55efc4', '#ffeaa7'][i]; ctx.beginPath(); ctx.arc(p.x - 45 + i * 30, p.y, 9, 0, 7); ctx.fill(); ctx.stroke(); }
        break;
      case 'dish':
        ctx.fillStyle = '#b2bec3'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#636e72'; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 7); ctx.fill();
        break;
      case 'window':
        ctx.fillStyle = '#0a0e2a'; ctx.beginPath(); ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) ctx.fillRect(p.x - p.w / 2 + 10 + (i * 37) % (p.w - 20), p.y - p.h / 2 + 6 + (i * 13) % (p.h - 12), 2, 2);
        break;
    }
    ctx.restore();
  }

  // Visibility polygon by ray marching through open space.
  function visibility(map, x, y, radius, closed) {
    const pts = [];
    const N = 160;
    const step = 14;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      let d = 0;
      while (d < radius && map.isOpen(x + dx * (d + step), y + dy * (d + step), closed)) d += step;
      if (d < radius) {
        let lo = d, hi = d + step;
        for (let k = 0; k < 4; k++) { const mid = (lo + hi) / 2; if (map.isOpen(x + dx * mid, y + dy * mid, closed)) lo = mid; else hi = mid; }
        d = Math.min(radius, hi + 22); // reveal a bit of wall
      }
      pts.push(x + dx * d, y + dy * d);
    }
    return pts;
  }

  return { prerender, visibility };
})();
