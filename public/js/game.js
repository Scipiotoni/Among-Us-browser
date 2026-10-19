// Client game engine: movement, rendering, interactions and the in-game HUD.
const Game = (() => {
  const C = SHARED;
  const $ = (id) => document.getElementById(id);
  let cv, ctx, fog, fctx, W = 0, H = 0, dpr = 1;
  const keys = new Set();
  const joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };

  const S = {
    mode: 'menu', map: null, meId: null,
    me: { x: 0, y: 0, dir: 1, moving: false, phase: 0 },
    players: new Map(), profiles: {},
    role: null, team: null, teammates: [], tasks: [], alive: true, ghostRole: null,
    bodies: [], sab: null, doors: [], progress: 0, info: {}, emergencyCd: 0, sabCd: 0, doorCd: {},
    frozen: false, inVent: null, selfShift: null, selfInv: false, selfShield: false,
    noise: [], fx: [], settings: null, near: {}, lastSend: 0, lastSent: null, console: null,
  };

  // ------------------------------------------------------------------ setup
  function init() {
    cv = $('game-canvas');
    ctx = cv.getContext('2d');
    fog = document.createElement('canvas');
    fctx = fog.getContext('2d');
    window.addEventListener('resize', resize);
    resize();
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
    setupJoystick();
    const bind = (id, fn) => $(id).addEventListener('click', (e) => { e.preventDefault(); Sfx.unlock(); fn(); });
    bind('act-use', doUse);
    bind('act-kill', doKill);
    bind('act-report', doReport);
    bind('act-vent', doVent);
    bind('act-sabotage', () => openMap('sabotage'));
    bind('act-ability', doAbility);
    bind('btn-map', () => openMap(S.team === 'impostor' ? 'sabotage' : 'map'));
    $('map-close').onclick = closeMap;
    $('console-close').onclick = closeConsole;
    requestAnimationFrame(frame);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    fog.width = W * dpr; fog.height = H * dpr;
  }

  function typing() {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT');
  }

  function onKey(e) {
    if (typing()) { if (e.key === 'Escape') document.activeElement.blur(); return; }
    const k = e.key.toLowerCase();
    if (S.mode === 'menu') return;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(k)) e.preventDefault();
    keys.add(k);
    if (e.repeat) return;
    if (k === 'escape') { Tasks.close(); closeMap(); closeConsole(); UI.closeModals(); return; }
    if (UI.modalOpen() && k !== 'tab') return;
    if (k === 'e' || k === ' ') doUse();
    else if (k === 'q') doKill();
    else if (k === 'r') doReport();
    else if (k === 'v') doVent();
    else if (k === 'f') doAbility();
    else if (k === 'tab' || k === 'm') { if ($('map-modal').classList.contains('hidden')) { if (S.mode === 'game') openMap(S.team === 'impostor' ? 'sabotage' : 'map'); } else closeMap(); }
    else if (k === 'enter') UI.focusChat();
  }

  function setupJoystick() {
    const base = $('joystick'), knob = $('joystick-knob');
    cv.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) {
        if (joy.active || t.clientX > W * 0.6) continue;
        Object.assign(joy, { active: true, id: t.identifier, ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 });
        base.style.left = t.clientX - 60 + 'px'; base.style.top = t.clientY - 60 + 'px';
        base.classList.remove('hidden');
      }
    }, { passive: true });
    cv.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== joy.id) continue;
        let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy;
        const d = Math.hypot(dx, dy), m = 50;
        if (d > m) { dx = dx / d * m; dy = dy / d * m; }
        joy.dx = dx / m; joy.dy = dy / m;
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }, { passive: true });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === joy.id) {
        joy.active = false; joy.id = null; joy.dx = joy.dy = 0;
        base.classList.add('hidden'); knob.style.transform = '';
      }
    };
    cv.addEventListener('touchend', end);
    cv.addEventListener('touchcancel', end);
  }

  // ------------------------------------------------------------------ mode switching
  function enterLobby(meId, profiles) {
    S.mode = 'lobby';
    S.map = C.MAPS.lobby;
    S.meId = meId;
    S.players.clear();
    Object.assign(S, { role: null, team: null, teammates: [], tasks: [], alive: true, ghostRole: null, bodies: [], sab: null, doors: [], inVent: null, frozen: false, noise: [], fx: [], selfShift: null, selfInv: false });
    const sp = S.map.spawnPoint(Math.floor(Math.random() * 12), 12);
    S.me.x = sp.x; S.me.y = sp.y;
    if (profiles) setProfiles(profiles);
    Tasks.close(); closeMap(); closeConsole();
    updateHud(true);
  }

  function setProfiles(list) { for (const p of list) S.profiles[p.id] = p; }

  function startMatch(d) {
    S.mode = 'game';
    S.map = C.MAPS[d.map];
    S.players.clear();
    setProfiles(d.players);
    Object.assign(S, {
      role: d.role, team: d.team, teammates: d.teammates, tasks: d.tasks, alive: true, ghostRole: null,
      settings: d.settings, numImpostors: d.numImpostors, bodies: [], sab: null, doors: [], inVent: null,
      noise: [], fx: [], frozen: true, selfShift: null, selfInv: false, info: {},
    });
    S.me.x = d.x; S.me.y = d.y;
    setTimeout(() => (S.frozen = false), 3500);
    updateHud(true);
  }

  function exitToMenu() {
    S.mode = 'menu';
    S.players.clear();
    Tasks.close(); closeMap(); closeConsole();
  }

  // ------------------------------------------------------------------ network handlers
  function onSnap(s) {
    const t = performance.now();
    const seen = new Set();
    for (const e of s.players) {
      seen.add(e.id);
      if (e.id === S.meId) {
        S.selfShift = e.s || null; S.selfInv = !!e.inv; S.selfShield = !!e.sh;
        if (S.mode === 'game' && e.a === 0 && S.alive) S.alive = false;
        continue;
      }
      let p = S.players.get(e.id);
      if (!p || t - p.seenAt > 300) {
        p = p || { id: e.id, phase: Math.random() * 10 };
        p.rx = e.x; p.ry = e.y;
        S.players.set(e.id, p);
      }
      Object.assign(p, { x: e.x, y: e.y, dir: e.d, moving: !!e.m, alive: e.a !== 0, shift: e.s || null, inv: !!e.inv, sc: !!e.sc, sh: !!e.sh, seenAt: t });
    }
    for (const id of [...S.players.keys()]) if (!seen.has(id)) S.players.delete(id);
    if (S.mode !== 'game') return;
    S.bodies = s.bodies || [];
    const prevSab = S.sab;
    S.sab = s.sab || null;
    S.doors = s.doors || [];
    S.progress = s.progress;
    S.info = s.me || {};
    S.emergencyCd = s.emergencyCd || 0;
    S.sabCd = s.sabCd || 0;
    S.doorCd = s.doorCd || {};
    const cur = Tasks.current;
    if (cur && cur.opts.update) cur.opts.update(S.sab);
    if (cur && cur.opts.sabPanel && (!S.sab || S.sab.type !== cur.opts.sabPanel)) Tasks.close();
    if (prevSab && !S.sab) document.body.classList.remove('crit');
  }

  function teleport(x, y) { S.me.x = x; S.me.y = y; }
  function setTasks(tasks) { S.tasks = tasks; updateHud(true); }
  function onVent(d) {
    S.inVent = d.vent;
    S.me.x = d.x; S.me.y = d.y;
    if (!d.vent) Sfx.vent();
    renderVentArrows();
  }
  function addFx(fx) { S.fx.push({ ...fx, t0: performance.now() }); }
  function onDeath(d) {
    S.alive = false;
    S.ghostRole = d.ghostRole || null;
    S.inVent = null;
    Tasks.close(); closeConsole();
    renderVentArrows();
    updateHud(true);
  }
  function addNoise(d) { S.noise.push({ x: d.x, y: d.y, until: performance.now() + d.duration * 1000, name: d.name }); }
  function meetingStarted() {
    S.frozen = true;
    S.inVent = null;
    S.noise = [];
    keys.clear();
    Tasks.close(); closeMap(); closeConsole();
    renderVentArrows();
  }
  function meetingEnded(positions) {
    const mine = positions.find((p) => p.id === S.meId);
    if (mine) teleport(mine.x, mine.y);
    S.bodies = [];
    S.frozen = false;
    S.players.clear();
  }
  function setFrozen(v) { S.frozen = v; }

  // ------------------------------------------------------------------ helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const closedDoors = () => { const o = {}; for (const r of S.doors) o[r] = true; return o; };
  const isGhost = () => S.mode === 'game' && !S.alive;
  const profile = (id) => S.profiles[id] || { name: '?', color: 'gray' };

  function visionRadius() {
    if (S.mode !== 'game' || !S.settings) return 99999;
    let r = C.BASE_VISION * (S.team === 'impostor' ? S.settings.impostorVision : S.settings.crewVision);
    if (S.sab && S.sab.type === 'lights' && S.team !== 'impostor') r = Math.max(90, r * 0.28);
    return r;
  }
  function canSee(x, y) {
    if (S.mode !== 'game' || isGhost()) return true;
    if (Math.hypot(x - S.me.x, y - S.me.y) > visionRadius()) return false;
    return S.map.lineOfSight(S.me.x, S.me.y, x, y, closedDoors());
  }

  function canMove() {
    if (S.mode === 'menu' || S.frozen || S.inVent || Tasks.current || S.console) return false;
    if (UI.modalOpen()) return false;
    return true;
  }

  // ------------------------------------------------------------------ main loop
  let lastT = performance.now(), hudTimer = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (S.mode !== 'menu') {
      update(dt);
      render(t / 1000);
      hudTimer -= dt;
      if (hudTimer <= 0) { hudTimer = 0.1; updateHud(); }
    }
    requestAnimationFrame(frame);
  }

  function update(dt) {
    const me = S.me;
    me.phase += dt;
    let vx = 0, vy = 0;
    if (canMove() && !typing()) {
      if (keys.has('w') || keys.has('arrowup')) vy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) vy += 1;
      if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
      if (keys.has('d') || keys.has('arrowright')) vx += 1;
      if (joy.active) { vx += joy.dx; vy += joy.dy; }
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    me.moving = len > 0.1;
    if (me.moving) {
      const spd = C.BASE_SPEED * (S.mode === 'game' && S.settings ? S.settings.playerSpeed : 1) * (isGhost() ? 1.2 : 1);
      const nx = me.x + vx * spd * dt, ny = me.y + vy * spd * dt;
      if (isGhost()) {
        me.x = Math.max(0, Math.min(S.map.width, nx));
        me.y = Math.max(0, Math.min(S.map.height, ny));
      } else {
        const cd = closedDoors();
        if (S.map.isWalkable(nx, me.y, cd)) me.x = nx;
        if (S.map.isWalkable(me.x, ny, cd)) me.y = ny;
      }
      if (Math.abs(vx) > 0.1) me.dir = vx > 0 ? 1 : -1;
    }
    const now = performance.now();
    if (now - S.lastSend > 50) {
      const msg = { x: Math.round(me.x), y: Math.round(me.y), dir: me.dir, moving: me.moving };
      const l = S.lastSent;
      if (!l || l.x !== msg.x || l.y !== msg.y || l.moving !== msg.moving || l.dir !== msg.dir || now - S.lastSend > 1000) {
        App.socket.emit('move', msg);
        S.lastSent = msg;
        S.lastSend = now;
      }
    }
    for (const p of S.players.values()) {
      const k = Math.min(1, dt * 14);
      p.rx += (p.x - p.rx) * k;
      p.ry += (p.y - p.ry) * k;
      p.phase += dt;
    }
    S.noise = S.noise.filter((n) => n.until > now);
    S.fx = S.fx.filter((f) => now - f.t0 < 1200);
    computeNear();
  }

  // ------------------------------------------------------------------ interactions
  function computeNear() {
    const me = S.me, n = { use: null, vent: null, kill: null, report: null, ability: null };
    const map = S.map;
    let best = C.USE_RANGE;
    const consider = (st, data) => { const d = dist(me, st); if (d <= best) { best = d; n.use = data; } };
    if (S.mode === 'lobby') {
      for (const id in map.stations) consider(map.stations[id], { kind: 'console', id, console: map.stations[id].console, label: map.stations[id].label });
    } else if (S.mode === 'game' && !S.inVent) {
      S.tasks.forEach((tk, i) => {
        if (tk.done) return;
        const def = C.TASKS[tk.id], step = def.steps[tk.step];
        consider(map.stations[step.station], { kind: 'task', index: i, game: step.game, label: def.name, fake: S.team !== 'crew' });
      });
      if (S.alive && S.sab) {
        for (const id in map.stations) {
          const st = map.stations[id];
          if (st.sab !== S.sab.type) continue;
          if (S.sab.type === 'o2' && S.sab.fixed && S.sab.fixed[id]) continue;
          consider(st, { kind: 'fix', id, label: st.label });
        }
      }
      for (const id of ['emergency', 'cams', 'admin', 'vitals']) {
        if (id === 'emergency' && !S.alive) continue;
        const st = map.stations[id];
        consider(st, { kind: 'console', id, console: st.console, label: st.label });
      }
    }
    if (S.mode === 'game' && S.alive) {
      const canVent = (S.team === 'impostor' && !S.selfInv) || S.role === 'engineer';
      if (canVent) {
        if (S.inVent) n.vent = { exit: true };
        else for (const v of map.vents) if (dist(me, v) <= C.USE_RANGE) { n.vent = v; break; }
      }
      if (!S.inVent) {
        if (S.team === 'impostor' && !S.selfInv) {
          const kd = C.KILL_DISTANCES[S.settings.killDistance];
          let bd = kd;
          for (const p of S.players.values()) {
            if (!p.alive || S.teammates.includes(p.id)) continue;
            const d = Math.hypot(p.rx - me.x, p.ry - me.y);
            if (d <= bd && canSee(p.rx, p.ry)) { bd = d; n.kill = p; }
          }
        }
        let br = C.REPORT_RANGE;
        for (const b of S.bodies) { const d = dist(me, b); if (d <= br && canSee(b.x, b.y)) { br = d; n.report = b; } }
      }
    }
    // role ability target
    if (S.mode === 'game') {
      const nearestPlayer = (range) => {
        let bp = null, bd = range;
        for (const p of S.players.values()) {
          if (!p.alive) continue;
          const d = Math.hypot(p.rx - me.x, p.ry - me.y);
          if (d <= bd && (isGhost() || canSee(p.rx, p.ry))) { bd = d; bp = p; }
        }
        return bp;
      };
      if (S.alive && S.role === 'tracker') n.ability = nearestPlayer(200);
      if (!S.alive && S.ghostRole === 'guardian') n.ability = nearestPlayer(240);
      if (S.alive && S.role === 'detective') n.ability = n.report;
    }
    S.near = n;
  }

  function doUse() {
    const u = S.near.use;
    if (!u || S.frozen || S.inVent) return;
    if (u.kind === 'console') return useConsole(u.console);
    if (u.kind === 'task') {
      if (u.fake) return UI.toast('You are an Impostor — these tasks are fake. Just pretend!', 'warn');
      const opts = {};
      if (u.game === 'scan') opts.onScan = (on) => App.socket.emit('scan', on);
      Tasks.open({ title: u.label, game: u.game, opts, onDone: () => App.socket.emit('task', { index: u.index }) });
      return;
    }
    if (u.kind === 'fix') {
      const type = S.sab && S.sab.type;
      const panel = u.id;
      if (type === 'reactor') Tasks.open({ title: 'Reactor Meltdown', game: 'reactorPad', opts: { sabPanel: 'reactor', onHold: (v) => App.socket.emit('fix', { panel, value: v }) } });
      else if (type === 'o2') Tasks.open({ title: 'Oxygen Keypad', game: 'keypad', opts: { sabPanel: 'o2', code: S.sab.code, submit: (v) => App.socket.emit('fix', { panel, value: v }) } });
      else if (type === 'lights') Tasks.open({ title: 'Fix Lights', game: 'lights', opts: { sabPanel: 'lights' }, onDone: () => App.socket.emit('fix', { panel }) });
      else if (type === 'comms') Tasks.open({ title: 'Restore Comms', game: 'commsDial', opts: { sabPanel: 'comms' }, onDone: () => App.socket.emit('fix', { panel }) });
    }
  }

  function doKill() {
    if (S.near.kill && S.info.kill <= 0 && !S.frozen) App.socket.emit('kill', S.near.kill.id);
  }
  function doReport() {
    if (S.near.report && !S.frozen) App.socket.emit('report', S.near.report.id);
  }
  function doVent() {
    if (S.frozen) return;
    const v = S.near.vent;
    if (!v) return;
    if (v.exit) App.socket.emit('vent', { action: 'exit' });
    else {
      if (S.role === 'engineer' && S.info.vent > 0) return;
      Tasks.close();
      App.socket.emit('vent', { action: 'enter', vent: v.id });
      Sfx.vent();
    }
  }
  function doAbility() {
    if (S.mode !== 'game' || S.frozen) return;
    const ready = (S.info.ability || 0) <= 0;
    switch (S.role) {
      case 'shapeshifter':
        if (!S.alive) return;
        if (S.selfShift) return App.socket.emit('ability', { type: 'shapeshift' });
        if (!ready) return;
        return UI.openPicker('Shapeshift into…', Object.values(S.profiles).filter((p) => p.id !== S.meId && App.room.players.some((q) => q.id === p.id)), (id) => App.socket.emit('ability', { type: 'shapeshift', target: id }));
      case 'phantom':
        if (!S.alive) return;
        if (S.selfInv || ready) App.socket.emit('ability', { type: 'vanish' });
        return;
      case 'scientist':
        if (S.alive && ready) App.socket.emit('ability', { type: 'vitals' });
        return;
      case 'tracker':
        if (S.alive && ready && S.near.ability) App.socket.emit('ability', { type: 'track', target: S.near.ability.id });
        return;
      case 'detective':
        if (S.alive && ready && S.near.ability) App.socket.emit('ability', { type: 'examine', target: S.near.ability.id });
        return;
    }
    if (S.ghostRole === 'guardian' && !S.alive && ready && S.near.ability) App.socket.emit('ability', { type: 'protect', target: S.near.ability.id });
  }

  function abilityInfo() {
    if (S.mode !== 'game') return null;
    const cd = S.info.ability || 0;
    if (S.alive) {
      switch (S.role) {
        case 'shapeshifter': return S.selfShift ? { label: 'Revert', icon: '🎭', ready: true } : { label: 'Shift', icon: '🎭', ready: cd <= 0, cd };
        case 'phantom': return S.selfInv ? { label: 'Appear', icon: '👻', ready: true } : { label: 'Vanish', icon: '👻', ready: cd <= 0, cd };
        case 'scientist': return { label: 'Vitals', icon: '💓', ready: cd <= 0, cd };
        case 'tracker': return { label: 'Track', icon: '📡', ready: cd <= 0 && !!S.near.ability, cd };
        case 'detective': return { label: 'Examine', icon: '🔍', ready: cd <= 0 && !!S.near.ability, cd };
      }
    } else if (S.ghostRole === 'guardian') return { label: 'Protect', icon: '🛡️', ready: cd <= 0 && !!S.near.ability, cd };
    return null;
  }

  // ------------------------------------------------------------------ consoles
  function useConsole(type) {
    if (type === 'wardrobe') return UI.openCustomize();
    if (type === 'settings') return UI.openSettings();
    if (type === 'emergency') return App.socket.emit('emergency');
    if (type === 'cams' || type === 'admin' || type === 'vitals') {
      App.socket.emit('console', { type }, (res) => {
        if (!res) return;
        if (res.error) return UI.toast(res.error, 'warn');
        if (type === 'admin') return openMap('admin', res.rooms);
        openConsole(type, res);
      });
    }
  }

  function openConsole(type, data) {
    S.console = type;
    const box = $('console-modal');
    const body = $('console-body');
    body.innerHTML = '';
    $('console-title').textContent = type === 'cams' ? 'Security Cameras' : 'Vitals';
    box.classList.remove('hidden');
    if (type === 'cams') {
      const c = document.createElement('canvas');
      c.width = 960; c.height = 640; c.className = 'cams-canvas';
      body.appendChild(c);
      const cctx = c.getContext('2d');
      const draw = (t) => {
        if (S.console !== 'cams') return;
        if (S.sab && S.sab.type === 'comms') { cctx.fillStyle = '#111'; cctx.fillRect(0, 0, 960, 640); cctx.fillStyle = '#e74c3c'; cctx.font = 'bold 40px sans-serif'; cctx.textAlign = 'center'; cctx.fillText('NO SIGNAL', 480, 330); }
        else S.map.cameras.forEach((cam, i) => {
          const vx = (i % 2) * 480, vy = Math.floor(i / 2) * 320;
          cctx.save();
          cctx.beginPath(); cctx.rect(vx, vy, 480, 320); cctx.clip();
          cctx.fillStyle = '#05070d'; cctx.fillRect(vx, vy, 480, 320);
          const z = 0.55;
          cctx.setTransform(z, 0, 0, z, vx + 240 - cam.x * z, vy + 160 - cam.y * z);
          drawScene(cctx, t / 1000, { cams: true });
          cctx.setTransform(1, 0, 0, 1, 0, 0);
          cctx.fillStyle = 'rgba(255,255,255,0.8)'; cctx.font = 'bold 16px monospace'; cctx.textAlign = 'left';
          cctx.fillText(cam.name, vx + 12, vy + 24);
          if (Math.floor(t / 600) % 2) { cctx.fillStyle = '#e74c3c'; cctx.beginPath(); cctx.arc(vx + 460, vy + 20, 7, 0, 7); cctx.fill(); }
          cctx.strokeStyle = '#111'; cctx.lineWidth = 6; cctx.strokeRect(vx, vy, 480, 320);
          cctx.restore();
        });
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    } else if (type === 'vitals') {
      const render = (list) => {
        body.innerHTML = '';
        body.appendChild(UI.vitalsList(list));
      };
      render(data.vitals);
      const iv = setInterval(() => {
        if (S.console !== 'vitals') return clearInterval(iv);
        App.socket.emit('console', { type: 'vitals' }, (r) => { if (S.console === 'vitals' && r && r.vitals) render(r.vitals); else if (r && r.error) closeConsole(); });
      }, 1000);
    }
  }
  function closeConsole() { S.console = null; $('console-modal').classList.add('hidden'); }

  // ------------------------------------------------------------------ minimap / sabotage map
  let mapState = null;
  function openMap(mode, adminData) {
    if (S.mode !== 'game') return;
    const box = $('map-modal');
    box.classList.remove('hidden');
    const side = $('map-side');
    side.innerHTML = '';
    mapState = { mode, admin: adminData };
    $('map-title').textContent = mode === 'sabotage' ? 'Sabotage' : mode === 'admin' ? 'Admin Map' : S.map.name;
    if (mode === 'sabotage') {
      for (const [type, label, icon] of [['reactor', 'Reactor Meltdown', '☢️'], ['o2', 'Oxygen Depletion', '💨'], ['lights', 'Lights Out', '💡'], ['comms', 'Comms Blackout', '📡']]) {
        const b = document.createElement('button');
        b.className = 'sab-btn'; b.dataset.type = type;
        b.innerHTML = `<span>${icon}</span>${label}<em></em>`;
        b.onclick = () => { App.socket.emit('sabotage', { type }); Sfx.sabotage(); closeMap(); };
        side.appendChild(b);
      }
      const hint = document.createElement('p');
      hint.className = 'muted'; hint.textContent = 'Click a 🚪 on the map to lock that room\'s doors.';
      side.appendChild(hint);
    }
    if (mode === 'admin') {
      const iv = setInterval(() => {
        if (!mapState || mapState.mode !== 'admin') return clearInterval(iv);
        App.socket.emit('console', { type: 'admin' }, (r) => { if (mapState && mapState.mode === 'admin' && r && r.rooms) mapState.admin = r.rooms; });
      }, 1000);
    }
    const c = $('map-canvas');
    c.onclick = (e) => {
      if (!mapState || mapState.mode !== 'sabotage') return;
      const r = c.getBoundingClientRect();
      const sc = c.width / S.map.width;
      const x = (e.clientX - r.left) * (c.width / r.width) / sc, y = (e.clientY - r.top) * (c.height / r.height) / sc;
      for (const room of S.map.rooms) {
        if (Math.hypot(x - (room.x + room.w / 2), y - (room.y + room.h - 50)) < 70) {
          App.socket.emit('sabotage', { type: 'doors', room: room.id });
          Sfx.door();
        }
      }
    };
    drawMapLoop();
  }
  function closeMap() { mapState = null; $('map-modal').classList.add('hidden'); }

  function drawMapLoop() {
    if (!mapState) return;
    const c = $('map-canvas');
    const m = S.map;
    const sc = c.width / m.width;
    c.height = Math.round(m.height * sc);
    const x = c.getContext('2d');
    const t = performance.now() / 1000;
    x.clearRect(0, 0, c.width, c.height);
    x.save();
    x.scale(sc, sc);
    const sabMode = mapState.mode === 'sabotage';
    x.fillStyle = sabMode ? '#5a1f2a' : '#24406b';
    for (const r of m.rects) x.fillRect(r.x - 20, r.y - 20, r.w + 40, r.h + 40);
    x.fillStyle = sabMode ? '#a5414f' : '#4e7fc4';
    for (const r of m.rects) x.fillRect(r.x, r.y, r.w, r.h);
    x.textAlign = 'center';
    x.font = 'bold 44px "Trebuchet MS", sans-serif';
    for (const r of m.rooms) { x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillText(r.name, r.x + r.w / 2, r.y + 60); }
    const comms = S.sab && S.sab.type === 'comms';
    if (mapState.mode === 'map' && !comms) {
      S.tasks.forEach((tk) => {
        if (tk.done) return;
        const st = m.stations[C.TASKS[tk.id].steps[tk.step].station];
        x.fillStyle = '#ffd32a'; x.beginPath(); x.arc(st.x, st.y, 26, 0, 7); x.fill();
        x.fillStyle = '#000'; x.font = 'bold 40px sans-serif'; x.fillText('!', st.x, st.y + 14);
      });
    }
    if (S.sab) for (const id in m.stations) {
      const st = m.stations[id];
      if (st.sab !== S.sab.type) continue;
      x.fillStyle = Math.sin(t * 8) > 0 ? '#ff4757' : '#ffa502';
      x.beginPath(); x.arc(st.x, st.y, 34, 0, 7); x.fill();
    }
    if (mapState.mode === 'admin' && mapState.admin && !comms) {
      for (const r of m.rooms) {
        const n = mapState.admin[r.id] || 0;
        for (let i = 0; i < n; i++) {
          x.fillStyle = '#f1f2f6'; x.strokeStyle = '#000'; x.lineWidth = 5;
          x.beginPath(); x.arc(r.x + r.w / 2 - (n - 1) * 30 + i * 60, r.y + r.h / 2 + 20, 24, 0, 7); x.fill(); x.stroke();
        }
      }
    }
    if (sabMode) {
      for (const r of m.rooms) {
        const cd = S.doorCd[r.id] || 0;
        const cx = r.x + r.w / 2, cy = r.y + r.h - 50;
        x.fillStyle = cd > 0 ? '#555' : '#ffdd59';
        x.beginPath(); x.arc(cx, cy, 44, 0, 7); x.fill();
        x.font = '50px sans-serif'; x.fillText(cd > 0 ? Math.ceil(cd / 1000) : '🚪', cx, cy + 17);
      }
      const sabCd = S.sabCd;
      document.querySelectorAll('.sab-btn').forEach((b) => {
        const off = sabCd > 0 || !!S.sab;
        b.disabled = off;
        b.querySelector('em').textContent = S.sab ? 'active' : sabCd > 0 ? Math.ceil(sabCd / 1000) + 's' : '';
      });
    }
    if (S.info.track && !comms) {
      x.fillStyle = '#1dd1a1'; x.beginPath(); x.arc(S.info.track.x, S.info.track.y, 30, 0, 7); x.fill();
    }
    // me
    const pr = profile(S.meId);
    x.fillStyle = Draw.col(pr.color).body; x.strokeStyle = '#fff'; x.lineWidth = 8;
    x.beginPath(); x.arc(S.me.x, S.me.y, 34, 0, 7); x.fill(); x.stroke();
    x.restore();
    requestAnimationFrame(drawMapLoop);
  }

  // ------------------------------------------------------------------ rendering
  function zoom() {
    const base = S.mode === 'lobby' ? 760 : 880;
    return Math.min(H / base, W / (base * 1.25));
  }

  function render(t) {
    const z = zoom();
    const cx = S.me.x, cy = S.me.y;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, W, H);
    // parallax stars
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 90; i++) {
      const sx = ((i * 137.5 - cx * 0.08) % W + W) % W, sy = ((i * 89.3 - cy * 0.08) % H + H) % H;
      ctx.fillRect(sx, sy, i % 3 ? 1.5 : 2.5, i % 3 ? 1.5 : 2.5);
    }
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cx * z), dpr * (H / 2 - cy * z));
    drawScene(ctx, t, {});
    // fog of war
    const fogOn = S.mode === 'game' && !isGhost();
    let vr = 0;
    if (fogOn) {
      vr = visionRadius();
      const pts = World.visibility(S.map, cx, cy, vr, closedDoors());
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.globalCompositeOperation = 'source-over';
      fctx.clearRect(0, 0, fog.width, fog.height);
      fctx.fillStyle = 'rgba(6,8,14,0.9)';
      fctx.fillRect(0, 0, fog.width, fog.height);
      fctx.globalCompositeOperation = 'destination-out';
      fctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cx * z), dpr * (H / 2 - cy * z));
      const g = fctx.createRadialGradient(cx, cy, vr * 0.55, cx, cy, vr);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) fctx.lineTo(pts[i], pts[i + 1]);
      fctx.closePath();
      fctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(fog, 0, 0);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - cx * z), dpr * (H / 2 - cy * z));
    }
    drawNames(ctx);
    // overlays in screen space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S.mode === 'game') {
      if (S.sab && (S.sab.type === 'reactor' || S.sab.type === 'o2')) {
        ctx.fillStyle = `rgba(255,0,0,${0.12 + Math.sin(t * 6) * 0.08})`;
        ctx.fillRect(0, 0, W, H);
      }
      const arrows = [];
      if (S.sab && S.alive) for (const id in S.map.stations) {
        const st = S.map.stations[id];
        if (st.sab === S.sab.type && !(S.sab.fixed && S.sab.fixed[id])) arrows.push({ x: st.x, y: st.y, color: '#ff4757' });
      }
      for (const n of S.noise) arrows.push({ x: n.x, y: n.y, color: '#feca57', pulse: true });
      if (S.info.track && !(S.sab && S.sab.type === 'comms')) arrows.push({ x: S.info.track.x, y: S.info.track.y, color: '#1dd1a1' });
      for (const a of arrows) drawArrow(a, z, t);
      if (S.inVent) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  function drawArrow(a, z, t) {
    const sx = (a.x - S.me.x) * z + W / 2, sy = (a.y - S.me.y) * z + H / 2;
    const m = 50;
    if (sx > m && sx < W - m && sy > m && sy < H - m) {
      if (a.pulse) { ctx.strokeStyle = a.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, 30 + (t * 60) % 40, 0, 7); ctx.stroke(); }
      return;
    }
    const ang = Math.atan2(sy - H / 2, sx - W / 2);
    const k = Math.min((W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - m) / Math.abs(Math.sin(ang) || 1e-6));
    const ax = W / 2 + Math.cos(ang) * k, ay = H / 2 + Math.sin(ang) * k;
    ctx.save();
    ctx.translate(ax, ay); ctx.rotate(ang);
    ctx.fillStyle = a.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Draws world contents in world coordinates (ctx already transformed).
  function drawScene(c, t, opts) {
    const map = S.map;
    const img = World.prerender(map);
    c.drawImage(img.canvas, -img.pad, -img.pad);
    const cd = closedDoors();
    // doors
    for (const d of map.doors) {
      if (cd[d.room]) {
        c.fillStyle = '#a4adbf'; c.fillRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8);
        c.strokeStyle = '#2f3542'; c.lineWidth = 3; c.strokeRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8);
        c.fillStyle = '#ff4757';
        if (d.w > d.h) c.fillRect(d.x + d.w / 2 - 10, d.y, 20, d.h); else c.fillRect(d.x, d.y + d.h / 2 - 10, d.w, 20);
      } else {
        c.fillStyle = '#2a3247';
        if (d.w > d.h) { c.fillRect(d.x - 6, d.y - 2, 12, d.h + 4); c.fillRect(d.x + d.w - 6, d.y - 2, 12, d.h + 4); }
        else { c.fillRect(d.x - 2, d.y - 6, d.w + 4, 12); c.fillRect(d.x - 2, d.y + d.h - 6, d.w + 4, 12); }
      }
    }
    // highlighted stations
    if (S.mode === 'game' && !opts.cams) {
      const glow = (st, color) => {
        c.strokeStyle = color; c.lineWidth = 4 + Math.sin(t * 5) * 1.5;
        c.beginPath(); c.roundRect(st.x - 22, st.y - 20, 44, 36, 7); c.stroke();
      };
      if (S.team === 'crew') S.tasks.forEach((tk) => {
        if (tk.done) return;
        glow(map.stations[C.TASKS[tk.id].steps[tk.step].station], '#ffd32a');
      });
      if (S.sab) for (const id in map.stations) if (map.stations[id].sab === S.sab.type) glow(map.stations[id], Math.sin(t * 8) > 0 ? '#ff4757' : '#ffa502');
      if (S.near.use) {
        const u = S.near.use;
        const st = u.kind === 'task' ? map.stations[C.TASKS[S.tasks[u.index].id].steps[S.tasks[u.index].step].station] : map.stations[u.id];
        if (st) glow(st, '#fff');
      }
    }
    if (S.mode === 'lobby') for (const id in map.stations) {
      const st = map.stations[id];
      c.strokeStyle = '#7bed9f'; c.lineWidth = 3 + Math.sin(t * 4); c.beginPath(); c.roundRect(st.x - 22, st.y - 20, 44, 36, 7); c.stroke();
      Draw.nameTag(c, st.x, st.y - 30, st.label, '#7bed9f', 0.9);
    }
    // vent fx
    for (const f of S.fx) {
      if (f.type !== 'vent') continue;
      const v = map.ventById[f.vent];
      if (!v) continue;
      const k = (performance.now() - f.t0) / 1200;
      c.fillStyle = `rgba(0,0,0,${0.8 * (1 - k)})`;
      c.beginPath(); c.roundRect(v.x - 26, v.y - 15 - Math.sin(k * Math.PI) * 18, 52, 30, 6); c.fill();
    }
    // bodies
    for (const b of S.bodies) {
      if (!opts.cams && !canSee(b.x, b.y)) continue;
      const alpha = b.d && b.d < 3000 ? b.d / 3000 : 1;
      Draw.body(c, b.x, b.y, b.color, alpha);
    }
    // characters
    const list = [];
    if (S.mode !== 'menu' && !S.inVent) list.push({ self: true, id: S.meId, x: S.me.x, y: S.me.y, dir: S.me.dir, moving: S.me.moving, phase: S.me.phase, alive: S.mode !== 'game' || S.alive, shift: S.selfShift, inv: S.selfInv, sh: S.selfShield, sc: false });
    for (const p of S.players.values()) list.push({ id: p.id, x: p.rx, y: p.ry, dir: p.dir, moving: p.moving, phase: p.phase, alive: p.alive, shift: p.shift, inv: p.inv, sh: p.sh, sc: p.sc });
    list.sort((a, b) => a.y - b.y);
    for (const p of list) {
      if (!p.self && !opts.cams && !canSee(p.x, p.y)) continue;
      if (opts.cams && (!p.alive || p.inv)) continue;
      const prof = profile(p.shift || p.id);
      if (p.sc) {
        c.fillStyle = 'rgba(46,213,115,0.25)';
        c.fillRect(p.x - 30, p.y - 70, 60, 75);
        c.fillStyle = 'rgba(46,213,115,0.8)';
        c.fillRect(p.x - 32, p.y - 70 + ((t * 80) % 70), 64, 4);
      }
      const ghost = S.mode === 'game' && !p.alive;
      let alpha = ghost ? 0.5 : 1;
      if (p.inv) alpha = 0.3;
      Draw.character(c, p.x, p.y, { ...prof, dir: p.dir, moving: p.moving, phase: p.phase, ghost, alpha });
      if (p.sh) {
        c.strokeStyle = `rgba(116,185,255,${0.6 + Math.sin(t * 6) * 0.3})`; c.lineWidth = 4;
        c.beginPath(); c.arc(p.x, p.y - 32, 42, 0, 7); c.stroke();
      }
      p._prof = prof; p._vis = true;
      p._ghost = ghost;
    }
    S._drawn = list;
  }

  function drawNames(c) {
    if (!S._drawn) return;
    for (const p of S._drawn) {
      if (!p._vis) continue;
      p._vis = false;
      const prof = p._prof;
      let color = '#fff';
      if (S.team === 'impostor' && (S.teammates.includes(p.id) || (p.self))) color = p.shift && !p.self ? '#fff' : '#ff4757';
      if (p.self && S.team === 'impostor') color = '#ff4757';
      Draw.nameTag(c, p.x, p.y - (prof.hat && prof.hat !== 'none' ? 92 : 80) - (p._ghost ? 8 : 0), prof.name, color);
    }
  }

  // ------------------------------------------------------------------ HUD
  function setBtn(id, show, enabled, label, cd) {
    const b = $(id);
    b.classList.toggle('hidden', !show);
    if (!show) return;
    b.classList.toggle('disabled', !enabled);
    if (label != null) b.querySelector('.lbl').textContent = label;
    const cde = b.querySelector('.cd');
    if (cde) cde.textContent = cd > 0 ? Math.ceil(cd / 1000) : '';
  }

  function updateHud(force) {
    const inGame = S.mode === 'game';
    const n = S.near;
    const u = n.use;
    const useLabel = !u ? 'Use' : u.kind === 'console' ? ({ emergency: 'Meeting', cams: 'Cams', admin: 'Admin', vitals: 'Vitals', wardrobe: 'Wardrobe', settings: 'Settings' }[u.console] || 'Use') : u.kind === 'fix' ? 'Fix' : 'Use';
    setBtn('act-use', S.mode !== 'menu', !!u && !(u.fake), useLabel);
    const imp = inGame && S.team === 'impostor';
    setBtn('act-kill', imp && S.alive, !!n.kill && (S.info.kill || 0) <= 0, 'Kill', S.info.kill);
    setBtn('act-report', inGame && S.alive, !!n.report, 'Report');
    setBtn('act-vent', inGame && S.alive && (imp || S.role === 'engineer'), !!n.vent && !(S.role === 'engineer' && !S.inVent && S.info.vent > 0), S.inVent ? 'Exit' : 'Vent', S.role === 'engineer' ? (S.inVent ? S.info.ventLeft : S.info.vent) : 0);
    setBtn('act-sabotage', imp, !S.sab || true, 'Sabotage');
    const ab = abilityInfo();
    setBtn('act-ability', !!ab, ab && ab.ready, ab && ab.label, ab && !ab.ready ? ab.cd : 0);
    if (ab) $('act-ability').querySelector('.ico').textContent = ab.icon;
    $('btn-map').classList.toggle('hidden', !inGame);
    $('game-hud').classList.toggle('hidden', !inGame);
    $('lobby-hud').classList.toggle('hidden', S.mode !== 'lobby');

    if (!inGame) return;
    // progress bar
    const pb = $('progress');
    if (S.progress == null) { pb.classList.add('unknown'); $('progress-fill').style.width = '0%'; }
    else { pb.classList.remove('unknown'); $('progress-fill').style.width = Math.round(S.progress * 100) + '%'; }
    // task list
    const comms = S.sab && S.sab.type === 'comms';
    const list = $('task-list');
    let html = '';
    if (comms) html = '<div class="tl-warn">⚠ Comms sabotaged</div>';
    else {
      if (S.team === 'impostor') html += '<div class="tl-imp">Sabotage and eliminate the crew.<br><small>Fake tasks:</small></div>';
      for (const tk of S.tasks) {
        const def = C.TASKS[tk.id];
        const st = S.map.stations[def.steps[Math.min(tk.step, def.steps.length - 1)].station];
        const room = S.map.roomAt(st.x, st.y);
        const steps = def.steps.length > 1 ? ` (${tk.done ? def.steps.length : tk.step}/${def.steps.length})` : '';
        html += `<div class="tl-item ${tk.done ? 'done' : tk.step > 0 ? 'partial' : ''}">${room ? room.name : ''}: ${def.name}${steps}</div>`;
      }
    }
    if (S.sab) {
      const names = { reactor: 'Reactor Meltdown', o2: 'Oxygen Depleted', lights: 'Fix Lights', comms: 'Comms Sabotaged' };
      const left = S.sab.left != null ? ` ${Math.ceil(S.sab.left / 1000)}s` : '';
      html = `<div class="tl-sab">${names[S.sab.type]}${left}${S.sab.type === 'o2' && S.sab.fixed ? ` (${(S.sab.fixed.o2A ? 1 : 0) + (S.sab.fixed.o2B ? 1 : 0)}/2)` : ''}</div>` + html;
    }
    if (!S.alive) html = '<div class="tl-ghost">You are dead. Finish your tasks to help your team!</div>' + html;
    if (list._html !== html) { list.innerHTML = html; list._html = html; }
    // role badge
    const R = C.ROLES[S.role] || C.ROLES.crewmate;
    const badge = $('role-badge');
    const bhtml = `<span style="color:${R.color}">${S.ghostRole === 'guardian' && !S.alive ? 'Guardian (ghost)' : R.name}</span>`;
    if (badge._html !== bhtml) { badge.innerHTML = bhtml; badge._html = bhtml; }
    // scientist vitals mini-panel
    const vp = $('vitals-mini');
    if (S.info.vitals) {
      vp.classList.remove('hidden');
      vp.innerHTML = `<b>Vitals ${Math.ceil(S.info.vitalsLeft / 1000)}s</b>` + S.info.vitals.map((v) => `<div class="vm ${v.alive ? '' : 'dead'}"><i style="background:${Draw.col(v.color).body}"></i>${v.name}</div>`).join('');
    } else vp.classList.add('hidden');
    const sw = $('status-line');
    let st = '';
    if (S.info.shiftLeft) st = `Shapeshifted: ${Math.ceil(S.info.shiftLeft / 1000)}s`;
    if (S.info.vanishLeft) st = `Vanished: ${Math.ceil(S.info.vanishLeft / 1000)}s`;
    if (S.info.track) st = `Tracking ${S.info.track.name}: ${Math.ceil(S.info.track.left / 1000)}s`;
    if (S.inVent && S.role === 'engineer' && S.info.ventLeft != null) st = `Vent time: ${Math.ceil(S.info.ventLeft / 1000)}s`;
    if (sw.textContent !== st) sw.textContent = st;
    if (S.sab && (S.sab.type === 'reactor' || S.sab.type === 'o2')) document.body.classList.add('crit'); else document.body.classList.remove('crit');
    if (force) renderVentArrows();
  }

  function renderVentArrows() {
    const box = $('vent-arrows');
    box.innerHTML = '';
    if (!S.inVent || !S.map || !S.map.ventById[S.inVent]) return;
    const v = S.map.ventById[S.inVent];
    for (const id of v.links) {
      const o = S.map.ventById[id];
      const ang = Math.atan2(o.y - v.y, o.x - v.x);
      const b = document.createElement('button');
      b.className = 'vent-arrow';
      b.style.left = `calc(50% + ${Math.cos(ang) * 120}px)`;
      b.style.top = `calc(50% + ${Math.sin(ang) * 120}px)`;
      b.innerHTML = `<span style="transform:rotate(${ang}rad)">➜</span><small>${S.map.roomById[o.room].name}</small>`;
      b.onclick = () => { App.socket.emit('vent', { action: 'move', vent: id }); Sfx.vent(); };
      box.appendChild(b);
    }
  }

  return {
    init, S, enterLobby, startMatch, exitToMenu, onSnap, teleport, setTasks, onVent, addFx, onDeath, addNoise,
    meetingStarted, meetingEnded, setProfiles, setFrozen, closeMap, closeConsole, updateHud,
  };
})();
