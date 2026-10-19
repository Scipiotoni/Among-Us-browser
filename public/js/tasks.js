// Task minigames, sabotage repair panels. Each game renders into a root element and calls done().
const Tasks = (() => {
  const panel = () => document.getElementById('task-panel');
  let current = null;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function makeCanvas(root, w, h) {
    const cv = el('canvas', 'tg-canvas');
    cv.width = w; cv.height = h;
    root.appendChild(cv);
    const ctx = cv.getContext('2d');
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (w / r.width), y: (e.clientY - r.top) * (h / r.height) }; };
    cv.style.touchAction = 'none';
    return { cv, ctx, pos };
  }
  function loop(node, fn) {
    let last = performance.now();
    const f = (t) => { if (!node.isConnected) return; fn((t - last) / 1000, t / 1000); last = t; requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  function msg(root, text) {
    let m = root.querySelector('.tg-msg');
    if (!m) { m = el('div', 'tg-msg'); root.appendChild(m); }
    m.textContent = text;
    return m;
  }
  function progressBar(root, label) {
    const wrap = el('div', 'tg-progress');
    wrap.innerHTML = `<div class="tg-progress-label">${label || ''}</div><div class="tg-bar"><div class="tg-fill"></div></div>`;
    root.appendChild(wrap);
    return { set: (v) => { wrap.querySelector('.tg-fill').style.width = Math.round(v * 100) + '%'; }, label: (t) => { wrap.querySelector('.tg-progress-label').textContent = t; } };
  }
  function holdButton(btn, onChange) {
    const on = (e) => { e.preventDefault(); onChange(true); btn.classList.add('held'); };
    const off = () => { onChange(false); btn.classList.remove('held'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  }

  // ------------------------------------------------------------------ games
  const G = {};

  G.wires = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 360);
    const colors = ['#e74c3c', '#3498db', '#f1c40f', '#e84393'];
    const L = shuffle([0, 1, 2, 3]), R = shuffle([0, 1, 2, 3]);
    const y = (i) => 60 + i * 80;
    const conn = {};
    let drag = null;
    cv.onpointerdown = (e) => {
      const p = pos(e);
      if (p.x > 90) return;
      const i = Math.round((p.y - 60) / 80);
      if (i >= 0 && i < 4 && conn[i] == null) { drag = { i, ...p }; cv.setPointerCapture(e.pointerId); }
    };
    cv.onpointermove = (e) => { if (drag) Object.assign(drag, pos(e)); };
    cv.onpointerup = (e) => {
      if (!drag) return;
      const p = pos(e);
      const j = Math.round((p.y - 60) / 80);
      if (p.x > 330 && j >= 0 && j < 4 && R[j] === L[drag.i] && !Object.values(conn).includes(j)) {
        conn[drag.i] = j; Sfx.click();
        if (Object.keys(conn).length === 4) setTimeout(done, 350);
      }
      drag = null;
    };
    loop(cv, () => {
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 440, 360);
      ctx.fillStyle = '#1b1e2b'; ctx.fillRect(0, 0, 40, 360); ctx.fillRect(400, 0, 40, 360);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[L[i]]; ctx.fillRect(0, y(i) - 10, 55, 20);
        ctx.fillStyle = colors[R[i]]; ctx.fillRect(385, y(i) - 10, 55, 20);
        ctx.fillStyle = '#ffd32a'; ctx.fillRect(55, y(i) - 6, 10, 12); ctx.fillRect(375, y(i) - 6, 10, 12);
      }
      ctx.lineWidth = 14; ctx.lineCap = 'round';
      for (const i in conn) { ctx.strokeStyle = colors[L[i]]; ctx.beginPath(); ctx.moveTo(62, y(i)); ctx.lineTo(378, y(conn[i])); ctx.stroke(); }
      if (drag) { ctx.strokeStyle = colors[L[drag.i]]; ctx.beginPath(); ctx.moveTo(62, y(drag.i)); ctx.lineTo(drag.x, drag.y); ctx.stroke(); }
    });
    msg(root, 'Drag each wire to the matching color.');
  };

  G.swipe = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 460, 300);
    let card = { x: 40, dragging: false, t0: 0 }, ok = false;
    const m = msg(root, 'Drag the card through the reader.');
    cv.onpointerdown = (e) => { const p = pos(e); if (!ok && p.y > 90 && p.y < 200 && Math.abs(p.x - (card.x + 60)) < 70) { card.dragging = true; card.t0 = performance.now(); card.off = p.x - card.x; cv.setPointerCapture(e.pointerId); } };
    cv.onpointermove = (e) => { if (card.dragging) card.x = Math.max(40, Math.min(320, pos(e).x - card.off)); };
    cv.onpointerup = () => {
      if (!card.dragging) return;
      card.dragging = false;
      const dt = (performance.now() - card.t0) / 1000;
      if (card.x < 310) { m.textContent = 'Bad read. Swipe all the way.'; Sfx.bad(); }
      else if (dt < 0.35) { m.textContent = 'Too fast. Try again.'; Sfx.bad(); }
      else if (dt > 1.4) { m.textContent = 'Too slow. Try again.'; Sfx.bad(); }
      else { m.textContent = 'Accepted. Thank you!'; ok = true; setTimeout(done, 500); return; }
      card.x = 40;
    };
    loop(cv, () => {
      ctx.fillStyle = '#3b3f51'; ctx.fillRect(0, 0, 460, 300);
      ctx.fillStyle = '#1b1e2b'; ctx.fillRect(20, 110, 420, 18);
      ctx.fillStyle = ok ? '#2ecc71' : '#e74c3c'; ctx.beginPath(); ctx.arc(420, 60, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#dfe6e9'; ctx.beginPath(); ctx.roundRect(card.x, 100, 120, 80, 8); ctx.fill();
      ctx.fillStyle = '#74b9ff'; ctx.fillRect(card.x + 10, 112, 40, 40);
      ctx.fillStyle = '#636e72'; ctx.fillRect(card.x + 58, 116, 50, 6); ctx.fillRect(card.x + 58, 130, 40, 6);
      ctx.fillStyle = '#5a6278'; ctx.fillRect(20, 128, 420, 30);
    });
  };

  function transfer(root, done, verb) {
    const b = el('button', 'tg-btn big', verb);
    root.appendChild(b);
    const pb = progressBar(root, '');
    b.onclick = () => {
      b.disabled = true;
      const t0 = performance.now(), D = 7000;
      const tick = () => {
        if (!root.isConnected) return;
        const v = Math.min(1, (performance.now() - t0) / D);
        pb.set(v); pb.label(`${verb}ing… ${Math.round(v * 100)}%  ${Math.ceil((1 - v) * 7)}s`);
        if (v >= 1) { pb.label('Complete!'); setTimeout(done, 400); } else requestAnimationFrame(tick);
      };
      tick();
    };
  }
  G.download = (root, done) => transfer(root, done, 'Download');
  G.upload = (root, done) => transfer(root, done, 'Upload');

  function fill(root, done, label, color) {
    const gauge = el('div', 'tg-gauge'); gauge.innerHTML = `<div class="tg-gauge-fill" style="background:${color}"></div>`;
    root.appendChild(gauge);
    const b = el('button', 'tg-btn big', label); root.appendChild(b);
    let held = false, v = 0;
    holdButton(b, (h) => { held = h; });
    loop(gauge, (dt) => {
      if (held && v < 1) { v = Math.min(1, v + dt / 3.2); if (v >= 1) setTimeout(done, 300); }
      gauge.firstChild.style.height = v * 100 + '%';
    });
    msg(root, 'Hold the button to fill.');
  }
  G.fuel = (root, done) => fill(root, done, 'HOLD TO FUEL', '#f39c12');
  G.water = (root, done) => fill(root, done, 'HOLD TO WATER', '#3498db');

  G.simon = (root, done) => {
    const grid = el('div', 'tg-simon'); root.appendChild(grid);
    const cells = [];
    for (let i = 0; i < 9; i++) { const c = el('button', 'tg-cell'); grid.appendChild(c); cells.push(c); }
    const m = msg(root, 'Watch the sequence, then repeat it.');
    let seq = [], input = 0, showing = false, round = 0;
    const flash = (i, cls = 'lit') => { cells[i].classList.add(cls); setTimeout(() => cells[i].classList.remove(cls), 300); };
    const next = () => {
      round++;
      if (round > 4) { m.textContent = 'Reactor stable!'; setTimeout(done, 400); return; }
      seq.push(Math.floor(Math.random() * 9));
      input = 0; showing = true;
      m.textContent = `Round ${round} / 4`;
      seq.forEach((s, k) => setTimeout(() => { flash(s); Sfx.beep(); if (k === seq.length - 1) setTimeout(() => (showing = false), 300); }, 600 + k * 500));
    };
    cells.forEach((c, i) => c.onclick = () => {
      if (showing) return;
      if (seq[input] === i) { flash(i); Sfx.click(); input++; if (input === seq.length) setTimeout(next, 500); }
      else { flash(i, 'wrong'); Sfx.bad(); seq = []; round = 0; m.textContent = 'Wrong! Starting over…'; showing = true; setTimeout(next, 1000); }
    });
    setTimeout(next, 300);
  };

  G.sample = (root, done) => {
    const b = el('button', 'tg-btn big', 'Start Analysis'); root.appendChild(b);
    const tubes = el('div', 'tg-tubes'); root.appendChild(tubes);
    const m = msg(root, 'Run the analyzer and pick the anomaly.');
    b.onclick = () => {
      b.disabled = true;
      let left = 12;
      const iv = setInterval(() => {
        if (!root.isConnected) return clearInterval(iv);
        left--; m.textContent = `Analyzing… ${left}s (you can wait here)`;
        if (left <= 0) {
          clearInterval(iv);
          m.textContent = 'Select the anomaly.';
          const bad = Math.floor(Math.random() * 5);
          for (let i = 0; i < 5; i++) {
            const t = el('button', 'tg-tube' + (i === bad ? ' bad' : ''));
            t.onclick = () => { if (i === bad) { Sfx.good(); done(); } else { Sfx.bad(); m.textContent = 'Wrong sample!'; } };
            tubes.appendChild(t);
          }
        }
      }, 1000);
    };
  };

  G.asteroids = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 360);
    const rocks = []; let hits = 0, spawn = 0;
    const need = 12;
    const m = msg(root, `Destroyed: 0 / ${need}`);
    let shot = null;
    cv.onpointerdown = (e) => {
      const p = pos(e);
      shot = { ...p, t: 0.15 };
      Sfx.beep();
      for (const r of rocks) if (!r.dead && Math.hypot(r.x - p.x, r.y - p.y) < r.r + 8) {
        r.dead = true; hits++; m.textContent = `Destroyed: ${hits} / ${need}`;
        if (hits >= need) setTimeout(done, 300);
        break;
      }
    };
    loop(cv, (dt) => {
      spawn -= dt;
      if (spawn <= 0 && hits < need) { spawn = 0.7; rocks.push({ x: 470, y: 30 + Math.random() * 300, vx: -(70 + Math.random() * 90), vy: (Math.random() - 0.5) * 40, r: 16 + Math.random() * 14, a: 0 }); }
      ctx.fillStyle = '#05081a'; ctx.fillRect(0, 0, 440, 360);
      ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % 440, (i * 53) % 360, 2, 2);
      for (const r of rocks) {
        r.x += r.vx * dt; r.y += r.vy * dt; r.a += dt;
        if (r.dead) continue;
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.a);
        ctx.fillStyle = '#7f8c8d'; ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 3;
        ctx.beginPath(); for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2; const rr = r.r * (0.8 + ((k * 7) % 3) * 0.12); ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      for (let i = rocks.length - 1; i >= 0; i--) if (rocks[i].x < -40 || rocks[i].dead) rocks.splice(i, 1);
      if (shot) {
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(220, 360); ctx.lineTo(shot.x, shot.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(shot.x, shot.y, 12, 0, 7); ctx.stroke();
        shot.t -= dt; if (shot.t <= 0) shot = null;
      }
    });
  };

  G.divert = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 340);
    const target = Math.floor(Math.random() * 6);
    let lv = 0, drag = false;
    const x = (i) => 50 + i * 68;
    cv.onpointerdown = (e) => { const p = pos(e); if (Math.abs(p.x - x(target)) < 30) { drag = true; cv.setPointerCapture(e.pointerId); } };
    cv.onpointermove = (e) => { if (drag) lv = Math.max(0, Math.min(1, (290 - pos(e).y) / 230)); };
    cv.onpointerup = () => { drag = false; if (lv > 0.95) { lv = 1; setTimeout(done, 300); } };
    loop(cv, (dt, t) => {
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 440, 340);
      for (let i = 0; i < 6; i++) {
        const v = i === target ? lv : 0;
        ctx.fillStyle = '#1b1e2b'; ctx.fillRect(x(i) - 6, 60, 12, 230);
        ctx.fillStyle = i === target ? (Math.sin(t * 6) > 0 ? '#f1c40f' : '#b7950b') : '#555';
        ctx.fillRect(x(i) - 20, 290 - v * 230 - 14, 40, 28);
        ctx.fillStyle = i === target && lv > 0.95 ? '#2ecc71' : '#7f8c8d';
        ctx.beginPath(); ctx.arc(x(i), 30, 9, 0, 7); ctx.fill();
      }
    });
    msg(root, 'Push the blinking lever all the way up.');
  };

  G.accept = (root, done) => {
    const b = el('button', 'tg-btn big', '⚡ Accept Diverted Power'); root.appendChild(b);
    b.onclick = () => { Sfx.good(); done(); };
  };

  G.numbers = (root, done) => {
    const grid = el('div', 'tg-numbers'); root.appendChild(grid);
    const m = msg(root, 'Press the numbers in order, 1 to 10.');
    let next = 1;
    for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])) {
      const b = el('button', 'tg-num', n);
      b.onclick = () => {
        if (n === next) { b.classList.add('on'); Sfx.click(); next++; if (next > 10) setTimeout(done, 300); }
        else { Sfx.bad(); next = 1; grid.querySelectorAll('.on').forEach((x) => x.classList.remove('on')); m.textContent = 'Wrong order! Start again from 1.'; }
      };
      grid.appendChild(b);
    }
  };

  G.calibrate = (root, done) => {
    const { cv, ctx } = makeCanvas(root, 440, 330);
    const rows = [0, 1, 2].map((i) => ({ a: Math.random() * 6, speed: 2.2 + i * 0.9, done: false, color: ['#f1c40f', '#3498db', '#2ecc71'][i] }));
    let active = 0;
    const b = el('button', 'tg-btn big', 'CALIBRATE'); root.appendChild(b);
    const m = msg(root, 'Press when the needle is in the bright zone.');
    b.onclick = () => {
      const r = rows[active];
      const ang = ((r.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (ang > Math.PI * 1.35 && ang < Math.PI * 1.65) { r.done = true; Sfx.good(); active++; if (active >= 3) setTimeout(done, 300); }
      else { Sfx.bad(); m.textContent = 'Missed! Try again.'; }
    };
    loop(cv, (dt) => {
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 440, 330);
      rows.forEach((r, i) => {
        if (!r.done && i === active) r.a += r.speed * dt;
        const cx = 80 + i * 140, cy = 160;
        ctx.fillStyle = '#1b1e2b'; ctx.beginPath(); ctx.arc(cx, cy, 55, 0, 7); ctx.fill();
        ctx.fillStyle = r.color; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 55, Math.PI * 1.35, Math.PI * 1.65); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = r.done ? '#2ecc71' : i === active ? '#fff' : '#777'; ctx.lineWidth = 4;
        const a = r.done ? Math.PI * 1.5 : r.a;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 50, cy + Math.sin(a) * 50); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 55, 0, 7); ctx.stroke();
      });
    });
  };

  G.shields = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 400, 360);
    const cells = [[200, 180]];
    for (let k = 0; k < 6; k++) cells.push([200 + Math.cos(k / 6 * Math.PI * 2) * 100, 180 + Math.sin(k / 6 * Math.PI * 2) * 100]);
    const red = cells.map(() => Math.random() < 0.55);
    if (!red.some(Boolean)) red[2] = true;
    cv.onpointerdown = (e) => {
      const p = pos(e);
      cells.forEach((c, i) => { if (Math.hypot(c[0] - p.x, c[1] - p.y) < 48) { red[i] = !red[i]; Sfx.click(); } });
      if (!red.some(Boolean)) setTimeout(done, 400);
    };
    loop(cv, () => {
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 400, 360);
      cells.forEach((c, i) => {
        ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; ctx.lineTo(c[0] + Math.cos(a) * 52, c[1] + Math.sin(a) * 52); } ctx.closePath();
        ctx.fillStyle = red[i] ? '#e74c3c' : '#ecf0f1'; ctx.fill(); ctx.strokeStyle = '#1b1e2b'; ctx.lineWidth = 5; ctx.stroke();
      });
    });
    msg(root, 'Tap the red cells to prime them.');
  };

  G.filter = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 340);
    const leaves = Array.from({ length: 6 }, () => ({ x: 160 + Math.random() * 250, y: 40 + Math.random() * 260, a: Math.random() * 6 }));
    let drag = null;
    cv.onpointerdown = (e) => { const p = pos(e); drag = leaves.find((l) => Math.hypot(l.x - p.x, l.y - p.y) < 30); if (drag) cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = (e) => { if (drag) Object.assign(drag, pos(e)); };
    cv.onpointerup = () => {
      if (drag && drag.x < 70) { leaves.splice(leaves.indexOf(drag), 1); Sfx.click(); if (!leaves.length) setTimeout(done, 300); }
      drag = null;
    };
    loop(cv, (dt, t) => {
      ctx.fillStyle = '#34495e'; ctx.fillRect(0, 0, 440, 340);
      ctx.fillStyle = '#111'; ctx.fillRect(0, 100, 60, 140);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 3; for (let y = 110; y < 240; y += 14) { ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(56, y); ctx.stroke(); }
      for (const l of leaves) {
        ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a + Math.sin(t * 2 + l.a) * 0.1);
        ctx.fillStyle = '#6ab04c'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 11, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#3d7a28'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.stroke();
        ctx.restore();
      }
    });
    msg(root, 'Drag the leaves into the vent on the left.');
  };

  G.garbage = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 400, 340);
    let lever = 0, drag = false, prog = 0;
    cv.onpointerdown = (e) => { const p = pos(e); if (p.x > 300) { drag = true; cv.setPointerCapture(e.pointerId); } };
    cv.onpointermove = (e) => { if (drag) lever = Math.max(0, Math.min(1, (pos(e).y - 80) / 180)); };
    cv.onpointerup = () => { drag = false; };
    loop(cv, (dt, t) => {
      if (!drag) lever = Math.max(0, lever - dt * 3);
      if (lever > 0.9 && prog < 1) { prog = Math.min(1, prog + dt / 2.5); if (prog >= 1) setTimeout(done, 300); }
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 400, 340);
      ctx.fillStyle = '#636e72'; ctx.fillRect(40, 40, 220, 260);
      ctx.fillStyle = '#1b1e2b'; ctx.fillRect(50, 50 + prog * 240, 200, 240 - prog * 240 + 0);
      for (let i = 0; i < 12 * (1 - prog); i++) { ctx.fillStyle = ['#e17055', '#fdcb6e', '#74b9ff', '#a29bfe'][i % 4]; ctx.fillRect(60 + (i * 41) % 170, 70 + prog * 230 + ((i * 29) % 200) * (1 - prog) + (lever > 0.9 ? Math.sin(t * 30 + i) * 2 : 0), 22, 16); }
      ctx.fillStyle = '#1b1e2b'; ctx.fillRect(335, 70, 12, 210);
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(341, 80 + lever * 180, 20, 0, 7); ctx.fill();
    });
    msg(root, 'Pull the lever down and hold it.');
  };

  G.align = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 340);
    let y = Math.random() < 0.5 ? 40 + Math.random() * 80 : 220 + Math.random() * 80, drag = false, ok = false;
    cv.onpointerdown = (e) => { if (ok) return; const p = pos(e); if (p.x > 330 && Math.abs(p.y - y) < 40) { drag = true; cv.setPointerCapture(e.pointerId); } };
    cv.onpointermove = (e) => { if (drag) y = Math.max(30, Math.min(310, pos(e).y)); };
    cv.onpointerup = () => { drag = false; if (Math.abs(y - 170) < 8) { y = 170; ok = true; setTimeout(done, 400); } };
    loop(cv, () => {
      ctx.fillStyle = '#2d3142'; ctx.fillRect(0, 0, 440, 340);
      ctx.strokeStyle = '#2ecc71'; ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 170); ctx.lineTo(420, 170); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(90, 170); ctx.rotate(Math.atan2(y - 170, 300));
      ctx.fillStyle = '#95a5a6'; ctx.beginPath(); ctx.roundRect(-50, -24, 110, 48, 12); ctx.fill();
      ctx.fillStyle = ok ? '#2ecc71' : '#e67e22'; ctx.fillRect(60, -10, 240, 20);
      ctx.restore();
      ctx.fillStyle = '#1b1e2b'; ctx.fillRect(365, 30, 10, 280);
      ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.roundRect(345, y - 14, 50, 28, 6); ctx.fill();
    });
    msg(root, 'Drag the slider so the beam lines up with the dashed line.');
  };

  G.chart = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 460, 320);
    const pts = Array.from({ length: 5 }, (_, i) => ({ x: 50 + i * 90, y: 60 + Math.random() * 200 }));
    let at = 0;
    cv.onpointerdown = (e) => {
      const p = pos(e), n = pts[at + 1];
      if (n && Math.hypot(n.x - p.x, n.y - p.y) < 30) { at++; Sfx.click(); if (at === pts.length - 1) setTimeout(done, 400); }
    };
    loop(cv, (dt, t) => {
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(0, 0, 460, 320);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < 460; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 320); ctx.stroke(); }
      ctx.strokeStyle = '#74b9ff'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 4; ctx.beginPath(); pts.slice(0, at + 1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.stroke();
      pts.forEach((p, i) => { ctx.fillStyle = i <= at ? '#2ecc71' : i === at + 1 ? (Math.sin(t * 8) > 0 ? '#fff' : '#74b9ff') : '#74b9ff'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, 7); ctx.fill(); });
      const s = pts[at]; ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.moveTo(s.x + 14, s.y); ctx.lineTo(s.x - 8, s.y - 9); ctx.lineTo(s.x - 8, s.y + 9); ctx.fill();
    });
    msg(root, 'Tap the next waypoint to plot the course.');
  };

  G.steer = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 360, 360);
    let c = { x: 60 + Math.random() * 240, y: 60 + Math.random() * 240 }, drag = false, ok = false;
    if (Math.hypot(c.x - 180, c.y - 180) < 60) c.x = 70;
    cv.onpointerdown = (e) => { if (!ok) { drag = true; c = pos(e); cv.setPointerCapture(e.pointerId); } };
    cv.onpointermove = (e) => { if (drag) c = pos(e); };
    cv.onpointerup = () => { drag = false; if (Math.hypot(c.x - 180, c.y - 180) < 14) { c = { x: 180, y: 180 }; ok = true; setTimeout(done, 400); } };
    loop(cv, () => {
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(0, 0, 360, 360);
      ctx.strokeStyle = 'rgba(116,185,255,0.4)'; ctx.lineWidth = 2;
      for (const r of [40, 90, 140]) { ctx.beginPath(); ctx.arc(180, 180, r, 0, 7); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(180, 20); ctx.lineTo(180, 340); ctx.moveTo(20, 180); ctx.lineTo(340, 180); ctx.stroke();
      ctx.strokeStyle = ok ? '#2ecc71' : '#f1c40f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, 7); ctx.moveTo(c.x - 30, c.y); ctx.lineTo(c.x + 30, c.y); ctx.moveTo(c.x, c.y - 30); ctx.lineTo(c.x, c.y + 30); ctx.stroke();
    });
    msg(root, 'Drag the crosshair to the center.');
  };

  G.scan = (root, done, opts) => {
    const pb = progressBar(root, 'Stand still on the scanner…');
    const lines = ['Scanning subject…', 'Measuring height: very short', 'Antenna signal: strong', 'Mood: mildly suspicious', 'Snack level: low', 'Scan complete!'];
    if (opts && opts.onScan) opts.onScan(true);
    const t0 = performance.now(), D = 8000;
    const tick = () => {
      if (!root.isConnected) return;
      const v = Math.min(1, (performance.now() - t0) / D);
      pb.set(v); pb.label(lines[Math.min(lines.length - 1, Math.floor(v * (lines.length - 1)))]);
      if (v >= 1) setTimeout(done, 400); else requestAnimationFrame(tick);
    };
    tick();
  };

  G.analyze = (root, done) => {
    const colors = shuffle(['#e74c3c', '#3498db', '#2ecc71', '#f1c40f']);
    const target = colors[Math.floor(Math.random() * 4)];
    const pb = progressBar(root, 'Centrifuging…');
    const tubes = el('div', 'tg-tubes'); root.appendChild(tubes);
    const t0 = performance.now();
    const tick = () => {
      if (!root.isConnected) return;
      const v = Math.min(1, (performance.now() - t0) / 5000);
      pb.set(v);
      if (v < 1) return requestAnimationFrame(tick);
      pb.label('Select the matching sample:');
      const tg = el('div', 'tg-swatch'); tg.style.background = target; tubes.before(tg);
      colors.forEach((c) => {
        const b = el('button', 'tg-tube'); b.style.setProperty('--tube', c);
        b.onclick = () => { if (c === target) { Sfx.good(); done(); } else Sfx.bad(); };
        tubes.appendChild(b);
      });
    };
    tick();
  };

  G.tune = (root, done) => {
    const { cv, ctx } = makeCanvas(root, 440, 240);
    const target = 2 + Math.random() * 6;
    const slider = el('input', 'tg-range'); slider.type = 'range'; slider.min = 1; slider.max = 9; slider.step = 0.01; slider.value = target > 5 ? 1.5 : 8.5;
    root.appendChild(slider);
    let good = 0;
    loop(cv, (dt, t) => {
      const f = +slider.value;
      const diff = Math.abs(f - target);
      good = diff < 0.15 ? good + dt : 0;
      if (good > 0.8) { good = -999; Sfx.good(); setTimeout(done, 200); }
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(0, 0, 440, 240);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(46,204,113,0.5)'; ctx.beginPath();
      for (let x = 0; x < 440; x += 4) ctx.lineTo(x, 120 + Math.sin(x / 440 * Math.PI * 2 * target + t * 3) * 60);
      ctx.stroke();
      ctx.strokeStyle = diff < 0.15 ? '#2ecc71' : '#f1c40f'; ctx.beginPath();
      for (let x = 0; x < 440; x += 4) ctx.lineTo(x, 120 + Math.sin(x / 440 * Math.PI * 2 * f + t * 3) * 60 + (Math.random() - 0.5) * diff * 12);
      ctx.stroke();
    });
    msg(root, 'Match the signal with the slider and hold it.');
  };

  // ------------------------------------------------------------------ sabotage panels
  G.reactorPad = (root, done, opts) => {
    const pad = el('button', 'tg-hand', '<span>✋</span><div>HOLD</div>');
    root.appendChild(pad);
    const m = msg(root, 'Hold the pad. Someone must hold the other pad at the same time!');
    holdButton(pad, (h) => opts.onHold(h));
    opts.update = (sab) => {
      if (!sab || sab.type !== 'reactor') return;
      const both = sab.held.reactorA && sab.held.reactorB;
      m.textContent = both ? 'Stabilizing…' : `Pads held: ${(sab.held.reactorA ? 1 : 0) + (sab.held.reactorB ? 1 : 0)} / 2`;
    };
  };

  G.keypad = (root, done, opts) => {
    const wrap = el('div', 'tg-keypad-wrap'); root.appendChild(wrap);
    const note = el('div', 'tg-note', `<small>Today's code</small><b>${opts.code || '?????'}</b>`); wrap.appendChild(note);
    const kp = el('div', 'tg-keypad'); wrap.appendChild(kp);
    const disp = el('div', 'tg-display', ''); kp.appendChild(disp);
    let val = '';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '✗', '0', '✓'];
    for (const k of keys) {
      const b = el('button', 'tg-key', k);
      b.onclick = () => {
        Sfx.click();
        if (k === '✗') val = '';
        else if (k === '✓') { if (val === opts.code) { opts.submit(val); disp.classList.add('ok'); setTimeout(done, 400); } else { Sfx.bad(); val = ''; } }
        else if (val.length < 5) val += k;
        disp.textContent = val;
      };
      kp.appendChild(b);
    }
  };

  G.lights = (root, done) => {
    const box = el('div', 'tg-switches'); root.appendChild(box);
    const st = Array.from({ length: 5 }, () => Math.random() < 0.5);
    if (st.every(Boolean)) st[0] = false;
    st.forEach((on, i) => {
      const s = el('button', 'tg-switch' + (on ? ' on' : ''));
      s.onclick = () => {
        st[i] = !st[i]; s.classList.toggle('on', st[i]); Sfx.click();
        if (st.every(Boolean)) setTimeout(done, 300);
      };
      box.appendChild(s);
    });
    msg(root, 'Flip every switch up to restore the lights.');
  };

  G.commsDial = (root, done) => {
    const { cv, ctx, pos } = makeCanvas(root, 440, 300);
    const target = Math.random() * Math.PI * 2;
    let ang = target + Math.PI, drag = false, good = 0;
    cv.onpointerdown = (e) => { drag = true; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = (e) => { if (drag) { const p = pos(e); ang = Math.atan2(p.y - 150, p.x - 330); } };
    cv.onpointerup = () => { drag = false; };
    loop(cv, (dt, t) => {
      let diff = Math.abs(((ang - target + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      good = diff < 0.15 ? good + dt : 0;
      if (good > 1) { good = -999; Sfx.good(); setTimeout(done, 200); }
      ctx.fillStyle = '#0c1a3a'; ctx.fillRect(0, 0, 440, 300);
      ctx.strokeStyle = diff < 0.15 ? '#2ecc71' : '#e74c3c'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 10; x < 230; x += 3) ctx.lineTo(x, 150 + Math.sin(x / 10 + t * 8) * 30 * (1 - diff / Math.PI) + (Math.random() - 0.5) * diff * 40);
      ctx.stroke();
      ctx.fillStyle = '#636e72'; ctx.beginPath(); ctx.arc(330, 150, 80, 0, 7); ctx.fill();
      ctx.fillStyle = '#2d3436'; ctx.beginPath(); ctx.arc(330, 150, 60, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(330, 150); ctx.lineTo(330 + Math.cos(ang) * 55, 150 + Math.sin(ang) * 55); ctx.stroke();
    });
    msg(root, 'Turn the dial until the signal is clear, then hold it.');
  };

  // ------------------------------------------------------------------ open/close
  function open({ title, game, onDone, onClose, opts }) {
    close();
    const p = panel();
    p.innerHTML = '';
    const head = el('div', 'tp-head', `<span>${title}</span>`);
    const x = el('button', 'tp-close', '✕'); x.onclick = () => close();
    head.appendChild(x);
    const body = el('div', 'tp-body');
    p.append(head, body);
    p.classList.remove('hidden');
    const o = opts || {};
    current = { game, onClose, opts: o, finished: false };
    const done = () => {
      if (!current || current.finished) return;
      current.finished = true;
      Sfx.task();
      body.classList.add('tg-done');
      setTimeout(() => { if (onDone) onDone(); close(true); }, 500);
    };
    (G[game] || G.download)(body, done, o);
    return current;
  }
  function close(completed) {
    const p = panel();
    if (!current) { p.classList.add('hidden'); return; }
    const c = current;
    current = null;
    p.classList.add('hidden');
    p.innerHTML = '';
    if (c.opts.onScan) c.opts.onScan(false);
    if (c.opts.onHold) c.opts.onHold(false);
    if (c.onClose) c.onClose(!!completed);
  }
  return { open, close, get current() { return current; } };
})();
