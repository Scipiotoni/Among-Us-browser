// Character rendering: an original round "blob" astronaut with big eyes, stubby feet and an antenna.
const Draw = (() => {
  const colorById = {};
  for (const c of SHARED.COLORS) colorById[c.id] = c;
  const col = (id) => colorById[id] || SHARED.COLORS[0];

  function ellipse(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 3; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  // Draws a character with feet at (x, y). opts: profile fields + dir, phase, scale, alpha, ghost, name, nameColor
  function character(ctx, x, y, o) {
    const s = o.scale || 1;
    const c = col(o.color);
    const dir = o.dir || 1;
    const t = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    const bob = o.moving ? Math.abs(Math.sin(t * 10)) * 3 : Math.sin(t * 2) * 0.8;
    const float = o.ghost ? Math.sin(t * 3) * 4 - 8 : 0;
    ctx.translate(0, float);

    // shadow
    if (!o.ghost) ellipse(ctx, 0, 0, 22, 6, 'rgba(0,0,0,0.25)');

    // cape goes behind the body
    if (o.outfit === 'cape') {
      ctx.save();
      ctx.fillStyle = '#b3202a';
      ctx.beginPath();
      ctx.moveTo(-dir * 6, -46 - bob);
      ctx.quadraticCurveTo(-dir * 34, -20, -dir * 26 - (o.moving ? Math.sin(t * 10) * 4 : 0), -4);
      ctx.lineTo(-dir * 4, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // feet
    if (!o.ghost) {
      const step = o.moving ? Math.sin(t * 10) * 6 : 0;
      ellipse(ctx, -9 + step, -5, 8, 6, c.shade, '#111', 2.5);
      ellipse(ctx, 9 - step, -5, 8, 6, c.shade, '#111', 2.5);
    }

    ctx.translate(0, -bob);
    // body
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
    // belly highlight
    ellipse(ctx, dir * 4, -22, 11, 8, 'rgba(255,255,255,0.18)');
    ellipse(ctx, -dir * 9, -44, 5, 3, 'rgba(255,255,255,0.45)');

    drawOutfit(ctx, o.outfit, dir, c, t);
    drawEyes(ctx, o.eyes, dir, o.dead, t);

    // antenna (hidden under big hats)
    const hat = o.hat || 'none';
    if (['none', 'flower', 'halo', 'horns', 'bow', 'headphones', 'sprout', 'antlers'].includes(hat)) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(dir * 4, -53);
      ctx.quadraticCurveTo(dir * 2, -62, -dir * 3, -66 + Math.sin(t * 4) * 1.5);
      ctx.stroke();
      ellipse(ctx, -dir * 3, -67 + Math.sin(t * 4) * 1.5, 4, 4, c.body, '#111', 2);
    }
    drawHat(ctx, hat, dir, t);
    ctx.restore();

    if (o.pet && o.pet !== 'none' && !o.ghost && !o.noPet) pet(ctx, x - dir * 38 * s, y + 2 * s, o.pet, dir, t, s * 0.9, o.moving);
  }

  function drawEyes(ctx, eyes, dir, dead, t) {
    const ex = dir * 5;
    const blink = !dead && (t % 4) > 3.85;
    if (dead) {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
      for (const sx of [-8, 8]) {
        ctx.beginPath();
        ctx.moveTo(ex + sx - 4, -37); ctx.lineTo(ex + sx + 4, -29);
        ctx.moveTo(ex + sx + 4, -37); ctx.lineTo(ex + sx - 4, -29);
        ctx.stroke();
      }
      return;
    }
    switch (eyes) {
      case 'cyclops':
        ellipse(ctx, ex, -33, 11, blink ? 1.5 : 11, '#fff', '#111', 2.5);
        if (!blink) ellipse(ctx, ex + dir * 3, -33, 5, 5, '#111');
        return;
      case 'shades':
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.roundRect(ex - 18, -38, 15, 10, 4); ctx.roundRect(ex + 3, -38, 15, 10, 4); ctx.fill();
        ctx.fillRect(ex - 4, -36, 8, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(ex - 15, -36, 4, 2); ctx.fillRect(ex + 6, -36, 4, 2);
        return;
      case 'goggles':
        ctx.fillStyle = '#222';
        ctx.fillRect(-23, -37, 46, 5);
        ellipse(ctx, ex - 8, -34, 7, 7, '#7fdcff', '#222', 3);
        ellipse(ctx, ex + 8, -34, 7, 7, '#7fdcff', '#222', 3);
        ellipse(ctx, ex - 10, -36, 2, 2, '#fff'); ellipse(ctx, ex + 6, -36, 2, 2, '#fff');
        return;
    }
    for (const sx of [-8, 8]) {
      const cx = ex + sx;
      if (blink || eyes === 'sleepy') {
        ellipse(ctx, cx, -33, 6, blink ? 1.2 : 3.5, '#fff', '#111', 2);
        if (!blink) { ctx.fillStyle = '#111'; ctx.fillRect(cx - 6, -36, 12, 2); }
        continue;
      }
      if (eyes === 'happy') {
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, -31, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        continue;
      }
      if (eyes === 'hearts') {
        ctx.fillStyle = '#ff3d7f';
        ctx.beginPath();
        ctx.moveTo(cx, -28);
        ctx.bezierCurveTo(cx - 9, -34, cx - 4, -41, cx, -36);
        ctx.bezierCurveTo(cx + 4, -41, cx + 9, -34, cx, -28);
        ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
        continue;
      }
      ellipse(ctx, cx, -33, 6, 7, '#fff', '#111', 2);
      if (eyes === 'stars') {
        star(ctx, cx + dir * 1.5, -33, 4.5, '#ffd32a');
      } else {
        ellipse(ctx, cx + dir * 2, -32, 3, 3.5, '#111');
        ellipse(ctx, cx + dir * 2 + 1, -34, 1, 1, '#fff');
      }
      if (eyes === 'angry') {
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
        ctx.beginPath();
        const inner = sx < 0 ? 1 : -1;
        ctx.moveTo(cx - 6, -41 + (inner > 0 ? 0 : 4)); ctx.lineTo(cx + 6, -41 + (inner > 0 ? 4 : 0));
        ctx.stroke();
      }
    }
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

  function drawOutfit(ctx, outfit, dir, c, t) {
    switch (outfit) {
      case 'scarf':
        ctx.fillStyle = '#e84118';
        ctx.beginPath(); ctx.roundRect(-20, -20, 40, 7, 3); ctx.fill();
        ctx.fillStyle = '#c23616';
        ctx.fillRect(-dir * 12 - 3, -16, 7, 14 + Math.sin(t * 6) * 1.5);
        break;
      case 'tie':
        ctx.fillStyle = '#2f3640';
        ctx.beginPath(); ctx.moveTo(dir * 3 - 3, -20); ctx.lineTo(dir * 3 + 3, -20); ctx.lineTo(dir * 3 + 4, -9); ctx.lineTo(dir * 3, -6); ctx.lineTo(dir * 3 - 4, -9); ctx.fill();
        break;
      case 'bowtie':
        ctx.fillStyle = '#c0392b';
        ctx.beginPath(); ctx.moveTo(dir * 3, -18); ctx.lineTo(dir * 3 - 8, -23); ctx.lineTo(dir * 3 - 8, -13); ctx.closePath();
        ctx.moveTo(dir * 3, -18); ctx.lineTo(dir * 3 + 8, -23); ctx.lineTo(dir * 3 + 8, -13); ctx.closePath(); ctx.fill();
        ellipse(ctx, dir * 3, -18, 2.5, 2.5, '#922b21');
        break;
      case 'suit':
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, -30, 21.5, 22.5, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#2d3436'; ctx.fillRect(-25, -22, 50, 20);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(dir * 3 - 6, -22); ctx.lineTo(dir * 3 + 6, -22); ctx.lineTo(dir * 3, -10); ctx.fill();
        ctx.fillStyle = '#d63031'; ctx.fillRect(dir * 3 - 1.5, -20, 3, 9);
        ctx.restore();
        break;
      case 'labcoat':
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, -30, 21.5, 22.5, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#f5f6fa'; ctx.fillRect(-25, -24, 50, 22);
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dir * 3, -24); ctx.lineTo(dir * 3, -2); ctx.stroke();
        ctx.fillStyle = '#74b9ff'; ctx.fillRect(dir * 8, -20, 6, 4);
        ctx.restore();
        break;
      case 'overalls':
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, -30, 21.5, 22.5, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#2e86de'; ctx.fillRect(-25, -18, 50, 18);
        ctx.fillRect(-12, -26, 4, 10); ctx.fillRect(8, -26, 4, 10);
        ellipse(ctx, -10, -18, 2, 2, '#f1c40f'); ellipse(ctx, 10, -18, 2, 2, '#f1c40f');
        ctx.restore();
        break;
      case 'stars':
        star(ctx, -10, -20, 4, '#ffeaa7'); star(ctx, 8, -14, 3.5, '#ffeaa7'); star(ctx, 12, -40, 3, '#ffeaa7'); star(ctx, -14, -42, 2.5, '#ffeaa7');
        break;
    }
  }

  function drawHat(ctx, hat, dir, t) {
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111';
    const P = (fill) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
    switch (hat) {
      case 'cap':
        ctx.beginPath(); ctx.ellipse(0, -51, 18, 10, 0, Math.PI, 0); ctx.closePath(); P('#e74c3c');
        ctx.beginPath(); ctx.ellipse(dir * 18, -51, 12, 3.5, 0, 0, Math.PI * 2); P('#c0392b');
        break;
      case 'tophat':
        ctx.beginPath(); ctx.ellipse(0, -52, 20, 4, 0, 0, Math.PI * 2); P('#222');
        ctx.beginPath(); ctx.rect(-12, -80, 24, 28); P('#222');
        ctx.fillStyle = '#c0392b'; ctx.fillRect(-12, -59, 24, 5);
        break;
      case 'crown':
        ctx.beginPath(); ctx.moveTo(-15, -50); ctx.lineTo(-17, -70); ctx.lineTo(-8, -61); ctx.lineTo(0, -73); ctx.lineTo(8, -61); ctx.lineTo(17, -70); ctx.lineTo(15, -50); ctx.closePath(); P('#f9ca24');
        ellipse(ctx, 0, -57, 3, 3, '#e84393');
        break;
      case 'beanie':
        ctx.beginPath(); ctx.ellipse(0, -50, 20, 15, 0, Math.PI, 0); ctx.closePath(); P('#6c5ce7');
        ctx.beginPath(); ctx.rect(-21, -53, 42, 6); P('#a29bfe');
        ellipse(ctx, 0, -66, 5, 5, '#fd79a8', '#111', 2);
        break;
      case 'party':
        ctx.beginPath(); ctx.moveTo(-12, -50); ctx.lineTo(dir * 3, -84); ctx.lineTo(12, -50); ctx.closePath(); P('#00cec9');
        ctx.fillStyle = '#fdcb6e'; for (const [a, b] of [[-4, -58], [4, -66], [0, -74]]) { ctx.beginPath(); ctx.arc(a, b, 2.2, 0, 7); ctx.fill(); }
        ellipse(ctx, dir * 3, -85, 4, 4, '#e17055', '#111', 1.5);
        break;
      case 'halo':
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffeaa7';
        ctx.beginPath(); ctx.ellipse(0, -66 + Math.sin(t * 3) * 2, 15, 5, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'horns':
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 8, -51); ctx.quadraticCurveTo(sx * 14, -62, sx * 18, -66); ctx.quadraticCurveTo(sx * 17, -56, sx * 15, -48); ctx.closePath(); P('#d63031'); }
        break;
      case 'chef':
        ctx.beginPath(); ctx.rect(-14, -60, 28, 10); P('#fff');
        ctx.beginPath(); ctx.arc(-9, -66, 9, 0, 7); ctx.arc(9, -66, 9, 0, 7); P('#fff');
        ctx.beginPath(); ctx.arc(0, -72, 10, 0, 7); P('#fff');
        break;
      case 'cowboy':
        ctx.beginPath(); ctx.ellipse(0, -52, 30, 6, 0, 0, Math.PI * 2); P('#a0522d');
        ctx.beginPath(); ctx.moveTo(-14, -52); ctx.quadraticCurveTo(-15, -74, 0, -68); ctx.quadraticCurveTo(15, -74, 14, -52); ctx.closePath(); P('#a0522d');
        ctx.fillStyle = '#5d2e0c'; ctx.fillRect(-14, -58, 28, 4);
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + t; ellipse(ctx, dir * 12 + Math.cos(a) * 5, -52 + Math.sin(a) * 5, 4, 4, '#fd79a8', '#111', 1.2); }
        ellipse(ctx, dir * 12, -52, 3, 3, '#fdcb6e');
        break;
      case 'headphones':
        ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -36, 24, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(-28, -42, 9, 16, 4); P('#0984e3');
        ctx.beginPath(); ctx.roundRect(19, -42, 9, 16, 4); P('#0984e3');
        break;
      case 'antlers':
        ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3.5;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 9, -51); ctx.lineTo(sx * 15, -72); ctx.moveTo(sx * 12, -62); ctx.lineTo(sx * 21, -66); ctx.moveTo(sx * 14, -69); ctx.lineTo(sx * 9, -76); ctx.stroke(); }
        break;
      case 'pirate':
        ctx.beginPath(); ctx.moveTo(-24, -52); ctx.quadraticCurveTo(0, -82, 24, -52); ctx.quadraticCurveTo(0, -58, -24, -52); P('#2d3436');
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -63, 3.5, 0, 7); ctx.fill();
        break;
      case 'wizard':
        ctx.beginPath(); ctx.ellipse(0, -52, 24, 5, 0, 0, Math.PI * 2); P('#4834d4');
        ctx.beginPath(); ctx.moveTo(-14, -53); ctx.quadraticCurveTo(-4, -76, -dir * 10, -92); ctx.quadraticCurveTo(6, -72, 14, -53); ctx.closePath(); P('#4834d4');
        star(ctx, 2, -64, 4, '#f9ca24');
        break;
      case 'bow':
        ctx.beginPath(); ctx.moveTo(dir * 10, -54); ctx.lineTo(dir * 2, -62); ctx.lineTo(dir * 2, -46); ctx.closePath(); P('#ff6b81');
        ctx.beginPath(); ctx.moveTo(dir * 10, -54); ctx.lineTo(dir * 18, -62); ctx.lineTo(dir * 18, -46); ctx.closePath(); P('#ff6b81');
        break;
      case 'helmet':
        ctx.globalAlpha *= 0.35;
        ellipse(ctx, 0, -34, 29, 30, '#dff9fb');
        ctx.globalAlpha /= 0.35;
        ctx.beginPath(); ctx.ellipse(0, -34, 29, 30, 0, 0, Math.PI * 2); ctx.strokeStyle = '#c7ecee'; ctx.lineWidth = 3; ctx.stroke();
        ellipse(ctx, -dir * 12, -50, 6, 3, 'rgba(255,255,255,0.7)');
        break;
      case 'sprout':
        ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(0, -64); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#111';
        ctx.beginPath(); ctx.ellipse(-6, -66, 7, 4, -0.5, 0, Math.PI * 2); P('#2ecc71');
        ctx.beginPath(); ctx.ellipse(6, -66, 7, 4, 0.5, 0, Math.PI * 2); P('#2ecc71');
        break;
    }
    ctx.restore();
  }

  function pet(ctx, x, y, type, dir, t, s, moving) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * 0.6, s * 0.6);
    const hop = moving ? Math.abs(Math.sin(t * 12)) * 6 : 0;
    ellipse(ctx, 0, 0, 14, 4, 'rgba(0,0,0,0.2)');
    ctx.translate(0, -hop);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#111';
    const eyes = (y0, gap) => { ellipse(ctx, dir * 3 - gap, y0, 2.5, 3, '#111'); ellipse(ctx, dir * 3 + gap, y0, 2.5, 3, '#111'); };
    switch (type) {
      case 'drone': {
        const f = Math.sin(t * 4) * 4 - 26;
        ctx.translate(0, f);
        ctx.beginPath(); ctx.roundRect(-14, -8, 28, 16, 6); ctx.fillStyle = '#b2bec3'; ctx.fill(); ctx.stroke();
        ellipse(ctx, dir * 4, 0, 5, 5, '#ff7675', '#111', 2);
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        ctx.fillRect(-22, -12, 14 * Math.abs(Math.cos(t * 30)), 2); ctx.fillRect(8, -12, 14 * Math.abs(Math.cos(t * 30)), 2);
        break;
      }
      case 'kitty':
        ellipse(ctx, 0, -14, 15, 13, '#fab1a0', '#111');
        ctx.beginPath(); ctx.moveTo(-12, -22); ctx.lineTo(-10, -34); ctx.lineTo(-3, -26); ctx.closePath(); ctx.fillStyle = '#fab1a0'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(10, -34); ctx.lineTo(3, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
        eyes(-15, 5);
        break;
      case 'slime':
        ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-16, -26, 0, -26); ctx.quadraticCurveTo(16, -26, 16, 0); ctx.closePath();
        ctx.fillStyle = 'rgba(85,239,196,0.85)'; ctx.fill(); ctx.stroke();
        eyes(-13, 5);
        break;
      case 'ufo': {
        ctx.translate(0, Math.sin(t * 3) * 4 - 24);
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
    const s = Math.min(w, h) / (opts.pet ? 110 : 95);
    if (opts.dead) {
      body(ctx, w / 2, h * 0.7, prof.color);
    } else {
      character(ctx, opts.pet ? w * 0.6 : w / 2, h * 0.88, { ...prof, dir: 1, scale: s, phase: opts.phase || 0, noPet: !opts.pet, ghost: opts.ghost });
    }
  }

  return { character, body, nameTag, portrait, pet, col, star, ellipse };
})();
