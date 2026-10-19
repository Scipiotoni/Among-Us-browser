const C = require('../shared/constants');
const { MAPS, TASKS } = require('../shared/map');

const TICK_MS = 50;
const now = () => Date.now();
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ids = (list) => list.map((x) => x.id);
const HAT_IDS = ids(C.HATS), EYE_IDS = ids(C.EYES), OUTFIT_IDS = ids(C.OUTFITS), PET_IDS = ids(C.PETS), COLOR_IDS = ids(C.COLORS);

function cleanName(n) {
  n = String(n || '').replace(/[^\p{L}\p{N} _\-.!?']/gu, '').trim().slice(0, C.MAX_NAME);
  return n || 'Player';
}

class Room {
  constructor(manager, code) {
    this.manager = manager;
    this.io = manager.io;
    this.code = code;
    this.players = new Map();
    this.hostId = null;
    this.admins = new Set();
    this.bans = new Set();
    this.settings = C.defaultSettings();
    this.phase = 'lobby';
    this.locked = false;
    this.game = null;
    this.map = MAPS.lobby;
    this.nextId = 1;
    this.interval = setInterval(() => this.tick(), TICK_MS);
  }

  destroy() { clearInterval(this.interval); if (this.game && this.game.endTimer) clearTimeout(this.game.endTimer); }

  // ------------------------------------------------------------------ helpers
  emitAll(ev, data) { this.io.to(this.code).emit(ev, data); }
  isAdmin(p) { return p && (p.id === this.hostId || this.admins.has(p.id)); }
  sys(text) { this.emitAll('chat', { system: true, text }); }
  notify(p, text, kind) { p.socket.emit('toast', { text, kind }); }
  alivePlayers() { return [...this.players.values()].filter((p) => p.alive); }

  profileOf(p) {
    return { id: p.id, name: p.name, color: p.color, hat: p.hat, eyes: p.eyes, outfit: p.outfit, pet: p.pet };
  }

  publicState() {
    return {
      code: this.code,
      hostId: this.hostId,
      admins: [...this.admins],
      phase: this.phase,
      locked: this.locked,
      settings: this.settings,
      players: [...this.players.values()].map((p) => ({ ...this.profileOf(p), muted: p.muted })),
    };
  }
  broadcastState() { this.emitAll('roomState', this.publicState()); }

  listing() {
    const host = this.players.get(this.hostId);
    return {
      code: this.code, host: host ? host.name : '?', players: this.players.size,
      max: this.settings.maxPlayers, impostors: this.settings.impostors, phase: this.phase,
    };
  }

  freeColor(wanted, exceptId) {
    const taken = new Set([...this.players.values()].filter((p) => p.id !== exceptId).map((p) => p.color));
    if (COLOR_IDS.includes(wanted) && !taken.has(wanted)) return wanted;
    return COLOR_IDS.find((c) => !taken.has(c)) || COLOR_IDS[0];
  }

  applyProfile(p, prof) {
    prof = prof || {};
    p.name = cleanName(prof.name);
    p.color = this.freeColor(prof.color, p.id);
    p.hat = HAT_IDS.includes(prof.hat) ? prof.hat : 'none';
    p.eyes = EYE_IDS.includes(prof.eyes) ? prof.eyes : 'normal';
    p.outfit = OUTFIT_IDS.includes(prof.outfit) ? prof.outfit : 'none';
    p.pet = PET_IDS.includes(prof.pet) ? prof.pet : 'none';
  }

  // ------------------------------------------------------------------ membership
  canJoin(clientId) {
    if (this.bans.has(clientId)) return 'You are banned from this lobby.';
    if (this.locked) return 'This lobby is locked.';
    if (this.phase !== 'lobby') return 'A game is in progress. Try again when it ends.';
    if (this.players.size >= this.settings.maxPlayers) return 'Lobby is full.';
    return null;
  }

  addPlayer(socket, profile, clientId) {
    const sp = this.map.spawnPoint(Math.floor(Math.random() * 12), 12);
    const p = {
      id: socket.id, socket, clientId, x: sp.x, y: sp.y, dir: 1, moving: false,
      alive: true, role: null, team: null, tasks: [], muted: false, joinedAt: now(), lastChat: 0, lastMove: now(),
    };
    this.applyProfile(p, profile);
    this.players.set(p.id, p);
    if (!this.hostId) this.hostId = p.id;
    socket.join(this.code);
    socket.data.room = this;
    this.sys(`${p.name} joined the lobby.`);
    this.broadcastState();
    return p;
  }

  removePlayer(id, reason) {
    const p = this.players.get(id);
    if (!p) return;
    this.players.delete(id);
    this.admins.delete(id);
    p.socket.leave(this.code);
    p.socket.data.room = null;
    if (this.hostId === id) {
      const next = [...this.admins][0] || [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt).map((x) => x.id)[0];
      this.hostId = next || null;
      this.admins.delete(next);
      const h = this.players.get(next);
      if (h) this.sys(`${h.name} is now the host.`);
    }
    this.sys(`${p.name} ${reason || 'left'}.`);
    if (this.players.size === 0) { this.manager.deleteRoom(this.code); return; }
    if (this.game && this.phase !== 'lobby') {
      this.emitAll('playerLeft', { id });
      const m = this.game.meeting;
      if (m) {
        m.votes.delete(id);
        if (m.stage === 'voting' && m.votes.size >= this.alivePlayers().length) this.tallyVotes();
      }
      this.recountTasks();
      this.checkWin();
    }
    this.broadcastState();
  }

  // ------------------------------------------------------------------ lobby actions
  onProfile(p, prof) {
    if (this.phase !== 'lobby') return;
    this.applyProfile(p, prof);
    this.broadcastState();
  }

  onChat(p, text) {
    text = String(text || '').trim().slice(0, 140);
    if (!text) return;
    const t = now();
    if (t - p.lastChat < 500) return;
    p.lastChat = t;
    if (p.muted) return this.notify(p, 'You are muted by an admin.', 'warn');
    const msg = { from: p.id, name: p.name, color: p.color, text, ghost: false };
    if (this.phase === 'lobby' || this.phase === 'ended') return this.emitAll('chat', msg);
    if (!p.alive) {
      msg.ghost = true;
      for (const q of this.players.values()) if (!q.alive) q.socket.emit('chat', msg);
      return;
    }
    if (this.phase === 'meeting') return this.emitAll('chat', msg);
    this.notify(p, 'You can only talk during meetings.', 'warn');
  }

  onSettings(p, s) {
    if (!this.isAdmin(p) || this.phase !== 'lobby' || !s) return;
    const out = this.settings;
    for (const f of C.SETTINGS_SCHEMA) {
      if (!f.key || !(f.key in s)) continue;
      if (f.type === 'bool') out[f.key] = !!s[f.key];
      else if (f.type === 'select') out[f.key] = clamp(Math.round(+s[f.key] || 0), 0, f.options.length - 1);
      else if (Number.isFinite(+s[f.key])) out[f.key] = clamp(+s[f.key], f.min, f.max);
    }
    out.maxPlayers = Math.max(out.maxPlayers, this.players.size, 4);
    if (s.roles) {
      for (const r of [...C.SPECIAL_CREW, ...C.SPECIAL_IMPOSTOR]) {
        const src = s.roles[r];
        if (!src) continue;
        const dst = out.roles[r];
        if (Number.isFinite(+src.count)) dst.count = clamp(Math.round(+src.count), 0, 15);
        if (Number.isFinite(+src.chance)) dst.chance = clamp(Math.round(+src.chance), 0, 100);
        for (const o of C.ROLES[r].options || []) {
          if (!(o.key in src)) continue;
          dst[o.key] = o.type === 'bool' ? !!src[o.key] : clamp(+src[o.key] || 0, o.min, o.max);
        }
      }
    }
    this.broadcastState();
  }

  onAdmin(p, { action, target } = {}) {
    if (!this.isAdmin(p)) return;
    const isHost = p.id === this.hostId;
    if (action === 'lock' || action === 'unlock') {
      this.locked = action === 'lock';
      this.sys(`Lobby ${this.locked ? 'locked' : 'unlocked'} by ${p.name}.`);
      return this.broadcastState();
    }
    if (action === 'endGame') {
      if (this.phase === 'lobby') return;
      this.sys(`${p.name} ended the game.`);
      return this.endGame(null, 'The game was ended by an admin.');
    }
    const t = this.players.get(target);
    if (!t || t.id === p.id) return;
    const targetIsAdmin = this.isAdmin(t);
    if (t.id === this.hostId) return;
    if (!isHost && targetIsAdmin && ['kick', 'ban', 'mute'].includes(action)) return this.notify(p, 'Only the host can do that to an admin.', 'warn');
    switch (action) {
      case 'kick':
        t.socket.emit('kicked', { reason: `You were kicked by ${p.name}.` });
        this.removePlayer(t.id, 'was kicked');
        break;
      case 'ban':
        this.bans.add(t.clientId);
        t.socket.emit('kicked', { reason: `You were banned by ${p.name}.` });
        this.removePlayer(t.id, 'was banned');
        break;
      case 'mute': t.muted = true; this.sys(`${t.name} was muted.`); this.broadcastState(); break;
      case 'unmute': t.muted = false; this.sys(`${t.name} was unmuted.`); this.broadcastState(); break;
      case 'promote':
        if (!isHost) return;
        this.admins.add(t.id); this.sys(`${t.name} is now an admin.`); this.broadcastState(); break;
      case 'demote':
        if (!isHost) return;
        this.admins.delete(t.id); this.sys(`${t.name} is no longer an admin.`); this.broadcastState(); break;
      case 'transfer':
        if (!isHost) return;
        this.admins.delete(t.id);
        this.admins.add(p.id);
        this.hostId = t.id;
        this.sys(`${t.name} is now the host.`);
        this.broadcastState();
        break;
    }
  }

  // ------------------------------------------------------------------ game start
  startGame(p) {
    if (!this.isAdmin(p) || this.phase !== 'lobby') return;
    const S = this.settings;
    const list = shuffle([...this.players.values()]);
    const n = list.length;
    const numImp = n <= 1 ? 0 : clamp(S.impostors, 1, Math.max(1, Math.floor((n - 1) / 2)));
    const t = now();

    for (const q of list) {
      Object.assign(q, {
        alive: true, role: 'crewmate', team: 'crew', tasks: [], inVent: null, emergencyLeft: S.emergencyMeetings,
        killCooldownEnd: t + 10000, abilityCooldownEnd: t + 10000, ventCooldownEnd: t, ventExitAt: 0,
        shiftInto: null, shiftEnd: 0, invisibleUntil: 0, protectedUntil: 0, protectedBy: null,
        trackTarget: null, trackUntil: 0, vitalsUntil: 0, scanning: false, examined: new Set(), diedAt: 0, ghostRole: null,
      });
    }
    list.slice(0, numImp).forEach((q) => { q.role = 'impostor'; q.team = 'impostor'; });

    const assignSpecial = (pool, roles) => {
      for (const r of shuffle(roles)) {
        const cfg = S.roles[r];
        for (let i = 0; i < cfg.count; i++) {
          if (Math.random() * 100 >= cfg.chance) continue;
          const cand = pool.filter((q) => q.role === (C.ROLES[r].team === 'impostor' ? 'impostor' : 'crewmate'));
          if (!cand.length) break;
          rand(cand).role = r;
        }
      }
    };
    assignSpecial(list.filter((q) => q.team === 'impostor'), C.SPECIAL_IMPOSTOR);
    assignSpecial(list.filter((q) => q.team === 'crew'), C.SPECIAL_CREW);

    // tasks
    const byKind = (k) => Object.keys(TASKS).filter((id) => TASKS[id].kind === k);
    const commons = shuffle(byKind('common')).slice(0, S.commonTasks);
    for (const q of list) {
      const chosen = [...commons, ...shuffle(byKind('long')).slice(0, S.longTasks), ...shuffle(byKind('short')).slice(0, S.shortTasks)];
      q.tasks = chosen.map((id) => ({ id, step: 0, done: false }));
    }

    this.map = MAPS.helix;
    this.phase = 'playing';
    this.game = {
      startedAt: t, numImpostors: numImp, bodies: [], sabotage: null, sabotageCooldownEnd: t + 15000,
      doors: {}, doorCooldown: {}, meeting: null, emergencyCooldownEnd: t + S.emergencyCooldown * 1000,
      progressShown: 0, over: false, noise: [],
    };
    this.recountTasks();
    list.forEach((q, i) => {
      const sp = this.map.spawnPoint(i, n);
      q.x = sp.x; q.y = sp.y; q.lastMove = t;
    });
    const impostorIds = list.filter((q) => q.team === 'impostor').map((q) => q.id);
    for (const q of list) {
      q.socket.emit('gameStart', {
        map: 'helix', role: q.role, team: q.team,
        teammates: q.team === 'impostor' ? impostorIds : [],
        tasks: q.tasks, x: q.x, y: q.y, numImpostors: numImp,
        players: list.map((o) => this.profileOf(o)), settings: S,
      });
    }
    this.broadcastState();
  }

  recountTasks() {
    if (!this.game) return;
    let total = 0, done = 0;
    for (const q of this.players.values()) {
      if (q.team !== 'crew') continue;
      for (const tk of q.tasks) {
        const steps = TASKS[tk.id].steps.length;
        total += steps;
        done += tk.done ? steps : tk.step;
      }
    }
    this.game.tasksTotal = total;
    this.game.tasksDone = done;
  }

  // ------------------------------------------------------------------ in-game actions
  canAct(p) { return this.phase === 'playing' && this.game && !this.game.over && p.role; }

  onMove(p, d) {
    if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.y)) return;
    if (this.phase === 'meeting' || (this.game && this.game.over && this.phase !== 'lobby')) return;
    if (this.phase === 'playing' && p.inVent) return;
    const t = now();
    const maxStep = C.BASE_SPEED * (this.phase === 'lobby' ? 1 : this.settings.playerSpeed) * ((t - p.lastMove) / 1000) * 1.6 + 40;
    if (Math.hypot(d.x - p.x, d.y - p.y) > maxStep) {
      p.socket.emit('teleport', { x: p.x, y: p.y });
      p.lastMove = t;
      return;
    }
    p.x = clamp(d.x, 0, this.map.width);
    p.y = clamp(d.y, 0, this.map.height);
    p.dir = d.dir === -1 ? -1 : 1;
    p.moving = !!d.moving;
    p.lastMove = t;
    if (p.scanning && dist(p, this.map.stations.medbay_scan) > C.USE_RANGE) p.scanning = false;
  }

  appearance(p) {
    if (p.shiftInto && this.players.has(p.shiftInto)) return this.profileOf(this.players.get(p.shiftInto));
    return this.profileOf(p);
  }

  onKill(p, targetId) {
    if (!this.canAct(p) || !p.alive || p.team !== 'impostor' || p.inVent) return;
    const t = now();
    if (p.invisibleUntil > t || t < p.killCooldownEnd) return;
    const v = this.players.get(targetId);
    if (!v || !v.alive || v.team === 'impostor' || v.inVent) return;
    if (dist(p, v) > C.KILL_DISTANCES[this.settings.killDistance] + 45) return;
    const kc = this.settings.killCooldown * 1000;
    if (v.protectedUntil > t) {
      p.killCooldownEnd = t + kc / 2;
      p.socket.emit('shielded', { id: v.id });
      const g = this.players.get(v.protectedBy);
      if (g) g.socket.emit('toast', { text: `Your shield saved ${v.name}!`, kind: 'good' });
      return;
    }
    const killerLook = this.appearance(p);
    v.alive = false;
    v.diedAt = t;
    v.scanning = false;
    v.protectedUntil = 0;
    if (v.role === 'guardian') { v.ghostRole = 'guardian'; v.abilityCooldownEnd = t + 5000; }
    const body = {
      id: this.nextId++, victimId: v.id, x: v.x, y: v.y, color: v.color, createdAt: t,
      killerId: p.id, dissolveAt: p.role === 'viper' ? t + this.settings.roles.viper.dissolveTime * 1000 : 0,
    };
    this.game.bodies.push(body);
    p.x = v.x; p.y = v.y;
    p.killCooldownEnd = t + kc;
    p.socket.emit('teleport', { x: p.x, y: p.y });
    p.socket.emit('killFx', { victim: this.profileOf(v) });
    v.socket.emit('youDied', { killer: killerLook, victim: this.profileOf(v), ghostRole: v.ghostRole });
    if (v.role === 'noisemaker') {
      const cfg = this.settings.roles.noisemaker;
      const until = t + cfg.alertDuration * 1000;
      for (const q of this.players.values()) {
        if (q.team === 'impostor' && !cfg.impostorsAlerted) continue;
        q.socket.emit('noise', { x: v.x, y: v.y, duration: cfg.alertDuration, name: v.name });
      }
      this.game.noise.push({ x: v.x, y: v.y, until });
    }
    this.checkWin();
  }

  onReport(p, bodyId) {
    if (!this.canAct(p) || !p.alive || p.inVent) return;
    const b = this.game.bodies.find((x) => x.id === bodyId);
    if (!b || dist(p, b) > C.REPORT_RANGE + 40) return;
    this.startMeeting(p, b);
  }

  onEmergency(p) {
    if (!this.canAct(p) || !p.alive || p.inVent) return;
    const t = now();
    const btn = this.map.stations.emergency;
    if (dist(p, btn) > C.USE_RANGE + 60) return;
    if (p.emergencyLeft <= 0) return this.notify(p, 'You have no emergency meetings left.', 'warn');
    if (t < this.game.emergencyCooldownEnd) return this.notify(p, 'Emergency button is cooling down.', 'warn');
    if (this.game.sabotage && ['reactor', 'o2'].includes(this.game.sabotage.type)) return this.notify(p, 'Emergency meetings are disabled during a crisis!', 'warn');
    p.emergencyLeft--;
    this.startMeeting(p, null);
  }

  onTask(p, { index } = {}) {
    if (!this.canAct(p) || p.team !== 'crew') return;
    const tk = p.tasks[index];
    if (!tk || tk.done) return;
    const def = TASKS[tk.id];
    const st = this.map.stations[def.steps[tk.step].station];
    if (dist(p, st) > C.USE_RANGE + 50) return;
    tk.step++;
    if (tk.step >= def.steps.length) tk.done = true;
    p.scanning = false;
    if (p.role === 'scientist') p.abilityCooldownEnd = Math.max(now(), p.abilityCooldownEnd - 5000);
    p.socket.emit('tasks', p.tasks);
    this.recountTasks();
    this.checkWin();
  }

  onScan(p, on) {
    if (!this.canAct(p) || !p.alive) return;
    p.scanning = !!on && dist(p, this.map.stations.medbay_scan) <= C.USE_RANGE + 40;
  }

  onVent(p, { action, vent } = {}) {
    if (!this.canAct(p) || !p.alive) return;
    const t = now();
    const isEng = p.role === 'engineer';
    if (p.team !== 'impostor' && !isEng) return;
    const vents = this.map.ventById;
    if (action === 'enter') {
      const v = vents[vent];
      if (!v || p.inVent || dist(p, v) > C.USE_RANGE + 40) return;
      if (p.invisibleUntil > t) return;
      if (isEng && t < p.ventCooldownEnd) return;
      p.inVent = v.id; p.x = v.x; p.y = v.y; p.scanning = false;
      if (isEng) p.ventExitAt = t + this.settings.roles.engineer.ventDuration * 1000;
      this.emitAll('ventFx', { vent: v.id });
      p.socket.emit('vent', { vent: v.id, x: v.x, y: v.y });
    } else if (action === 'move') {
      const cur = vents[p.inVent];
      if (!cur || !cur.links.includes(vent)) return;
      const v = vents[vent];
      p.inVent = v.id; p.x = v.x; p.y = v.y;
      p.socket.emit('vent', { vent: v.id, x: v.x, y: v.y });
    } else if (action === 'exit') {
      this.exitVent(p);
    }
  }

  exitVent(p) {
    if (!p.inVent) return;
    const v = this.map.ventById[p.inVent];
    p.inVent = null;
    if (p.role === 'engineer') p.ventCooldownEnd = now() + this.settings.roles.engineer.ventCooldown * 1000;
    this.emitAll('ventFx', { vent: v.id });
    p.socket.emit('vent', { vent: null, x: v.x, y: v.y });
  }

  onSabotage(p, { type, room } = {}) {
    if (!this.canAct(p) || p.team !== 'impostor') return;
    const t = now();
    const g = this.game;
    if (type === 'doors') {
      if (!this.map.roomById[room]) return;
      if ((g.doorCooldown[room] || 0) > t) return;
      g.doors[room] = t + C.DOOR_CLOSE_TIME * 1000;
      g.doorCooldown[room] = t + C.DOOR_COOLDOWN * 1000;
      this.emitAll('doorsFx', { room });
      return;
    }
    if (!['reactor', 'o2', 'lights', 'comms'].includes(type)) return;
    if (g.sabotage || t < g.sabotageCooldownEnd) return;
    const s = { type, startedAt: t };
    if (type === 'reactor') { s.endsAt = t + C.SABOTAGE_CRITICAL_TIME * 1000; s.held = { reactorA: null, reactorB: null }; }
    if (type === 'o2') {
      s.endsAt = t + C.SABOTAGE_CRITICAL_TIME * 1000; s.fixed = { o2A: false, o2B: false };
      s.code = String(Math.floor(10000 + Math.random() * 90000));
    }
    g.sabotage = s;
    this.emitAll('sabotage', { type });
    if (type === 'comms') for (const q of this.players.values()) q.vitalsUntil = 0;
  }

  onFix(p, { panel, value } = {}) {
    if (!this.canAct(p) || !p.alive) return;
    const s = this.game.sabotage;
    const st = this.map.stations[panel];
    if (!s || !st || st.sab !== s.type || dist(p, st) > C.USE_RANGE + 50) return;
    if (s.type === 'reactor') {
      if (value) s.held[panel] = p.id;
      else if (s.held[panel] === p.id) s.held[panel] = null;
      if (s.held.reactorA && s.held.reactorB && s.held.reactorA !== s.held.reactorB) this.fixSabotage();
    } else if (s.type === 'o2') {
      if (String(value) === s.code) {
        s.fixed[panel] = true;
        p.socket.emit('toast', { text: 'Keypad accepted.', kind: 'good' });
        if (s.fixed.o2A && s.fixed.o2B) this.fixSabotage();
      }
    } else {
      this.fixSabotage();
    }
  }

  fixSabotage() {
    const g = this.game;
    if (!g.sabotage) return;
    g.sabotage = null;
    g.sabotageCooldownEnd = now() + C.SABOTAGE_COOLDOWN * 1000;
    this.emitAll('sabotageFixed', {});
  }

  onAbility(p, { type, target } = {}) {
    if (!this.canAct(p)) return;
    const t = now();
    const R = this.settings.roles;
    const ready = t >= p.abilityCooldownEnd;
    const tgt = this.players.get(target);

    if (type === 'shapeshift' && p.role === 'shapeshifter' && p.alive && !p.inVent) {
      if (p.shiftInto) { this.unshift(p); return; }
      if (!ready || !tgt || tgt.id === p.id) return;
      p.shiftInto = tgt.id;
      p.shiftEnd = t + R.shapeshifter.shiftDuration * 1000;
      this.emitAll('shiftFx', { id: p.id });
    } else if (type === 'vanish' && p.role === 'phantom' && p.alive && !p.inVent) {
      if (p.invisibleUntil > t) { this.appear(p); return; }
      if (!ready) return;
      p.invisibleUntil = t + R.phantom.vanishDuration * 1000;
      this.emitAll('vanishFx', { id: p.id, x: p.x, y: p.y });
    } else if (type === 'track' && p.role === 'tracker' && p.alive) {
      if (!ready || !tgt || !tgt.alive || tgt.id === p.id || dist(p, tgt) > 220) return;
      p.trackTarget = tgt.id;
      p.trackUntil = t + R.tracker.trackDuration * 1000;
      p.abilityCooldownEnd = p.trackUntil + R.tracker.trackCooldown * 1000;
      this.notify(p, `Tracking ${tgt.name}…`, 'good');
    } else if (type === 'vitals' && p.role === 'scientist' && p.alive) {
      if (!ready) return;
      if (this.game.sabotage && this.game.sabotage.type === 'comms') return this.notify(p, 'Comms are down!', 'warn');
      p.vitalsUntil = t + R.scientist.vitalsDuration * 1000;
      p.abilityCooldownEnd = p.vitalsUntil + R.scientist.vitalsCooldown * 1000;
    } else if (type === 'protect' && p.ghostRole === 'guardian' && !p.alive) {
      if (!ready || !tgt || !tgt.alive || dist(p, tgt) > 260) return;
      tgt.protectedUntil = t + R.guardian.protectDuration * 1000;
      tgt.protectedBy = p.id;
      p.abilityCooldownEnd = t + R.guardian.protectCooldown * 1000;
      this.notify(p, `${tgt.name} is protected.`, 'good');
    } else if (type === 'examine' && p.role === 'detective' && p.alive) {
      const b = this.game.bodies.find((x) => x.id === target);
      if (!ready || !b || dist(p, b) > C.REPORT_RANGE + 40) return;
      const killer = this.players.get(b.killerId);
      const victim = this.players.get(b.victimId);
      const others = [...this.players.values()].filter((q) => q.id !== b.killerId && q.id !== b.victimId && q.id !== p.id);
      const decoy = others.length ? rand(others) : null;
      const suspects = shuffle([killer, decoy].filter(Boolean)).map((q) => this.profileOf(q));
      p.abilityCooldownEnd = t + R.detective.examineCooldown * 1000;
      p.socket.emit('clue', {
        victim: victim ? this.profileOf(victim) : { name: '???' },
        seconds: Math.round((t - b.createdAt) / 1000), suspects,
      });
    }
  }

  unshift(p) {
    if (!p.shiftInto) return;
    p.shiftInto = null;
    p.abilityCooldownEnd = now() + this.settings.roles.shapeshifter.shiftCooldown * 1000;
    this.emitAll('shiftFx', { id: p.id });
  }
  appear(p) {
    p.invisibleUntil = 0;
    p.abilityCooldownEnd = now() + this.settings.roles.phantom.vanishCooldown * 1000;
    this.emitAll('vanishFx', { id: p.id, x: p.x, y: p.y, appear: true });
  }

  onConsole(p, { type } = {}, cb) {
    if (!this.canAct(p) || typeof cb !== 'function') return;
    const st = this.map.stations[type];
    if (!st || dist(p, st) > C.USE_RANGE + 50) return cb({ error: 'Too far away.' });
    if (this.game.sabotage && this.game.sabotage.type === 'comms') return cb({ error: 'COMMS SABOTAGED' });
    if (type === 'vitals') return cb({ vitals: this.vitals() });
    if (type === 'admin') return cb({ rooms: this.roomCounts() });
    cb({ ok: true });
  }

  vitals() {
    return [...this.players.values()].map((q) => ({ ...this.profileOf(q), alive: q.alive }));
  }
  roomCounts() {
    const counts = {};
    for (const q of this.players.values()) {
      if (!q.alive || q.inVent) continue;
      const r = this.map.roomAt(q.x, q.y);
      if (r) counts[r.id] = (counts[r.id] || 0) + 1;
    }
    for (const b of this.game.bodies) {
      const r = this.map.roomAt(b.x, b.y);
      if (r) counts[r.id] = (counts[r.id] || 0) + 1;
    }
    return counts;
  }

  // ------------------------------------------------------------------ meetings
  startMeeting(caller, body) {
    const g = this.game;
    const t = now();
    this.phase = 'meeting';
    if (g.sabotage && ['reactor', 'o2'].includes(g.sabotage.type)) { g.sabotage = null; g.sabotageCooldownEnd = t + C.SABOTAGE_COOLDOWN * 1000; }
    g.doors = {};
    for (const q of this.players.values()) {
      if (q.inVent) this.exitVent(q);
      if (q.shiftInto) q.shiftInto = null;
      q.invisibleUntil = 0;
      q.scanning = false;
      q.vitalsUntil = 0;
      q.moving = false;
    }
    const victim = body ? this.players.get(body.victimId) : null;
    g.bodies = [];
    g.noise = [];
    g.progressShown = g.tasksDone;
    const disc = this.settings.discussionTime;
    g.meeting = {
      callerId: caller.id, type: body ? 'report' : 'emergency', votes: new Map(),
      stage: disc > 0 ? 'discussion' : 'voting', stageEndsAt: t + 3000 + (disc > 0 ? disc : this.settings.votingTime) * 1000,
    };
    this.emitAll('meeting', {
      type: g.meeting.type, caller: this.profileOf(caller), body: victim ? this.profileOf(victim) : null,
      stage: g.meeting.stage, endsIn: g.meeting.stageEndsAt - t,
      players: [...this.players.values()].map((q) => ({ ...this.profileOf(q), alive: q.alive })),
    });
  }

  onVote(p, target) {
    const m = this.game && this.game.meeting;
    if (this.phase !== 'meeting' || !m || m.stage !== 'voting' || !p.alive || m.votes.has(p.id)) return;
    if (target !== 'skip') {
      const tq = this.players.get(target);
      if (!tq || !tq.alive) return;
    }
    m.votes.set(p.id, target);
    this.emitAll('voted', { id: p.id });
    const voters = this.alivePlayers().length;
    if (m.votes.size >= voters) this.tallyVotes();
  }

  tallyVotes() {
    const g = this.game, m = g.meeting;
    if (m.stage !== 'voting') return;
    const counts = new Map();
    for (const [, tg] of m.votes) counts.set(tg, (counts.get(tg) || 0) + 1);
    let best = null, bestN = 0, tie = false;
    for (const [tg, nn] of counts) {
      if (nn > bestN) { best = tg; bestN = nn; tie = false; } else if (nn === bestN) tie = true;
    }
    const ejected = !tie && best && best !== 'skip' ? this.players.get(best) : null;
    const votes = [...m.votes].map(([voter, tg]) => ({ voter: this.settings.anonymousVotes ? null : voter, target: tg }));
    m.stage = 'results';
    m.stageEndsAt = now() + 5000;
    m.ejectedId = ejected ? ejected.id : null;
    m.tie = tie;
    this.emitAll('voteResults', { votes, ejected: ejected ? ejected.id : null, tie });
  }

  meetingTick(t) {
    const m = this.game.meeting;
    if (!m || t < m.stageEndsAt) return;
    if (m.stage === 'discussion') {
      m.stage = 'voting';
      m.stageEndsAt = t + this.settings.votingTime * 1000;
      this.emitAll('meetingStage', { stage: 'voting', endsIn: m.stageEndsAt - t });
    } else if (m.stage === 'voting') {
      this.tallyVotes();
    } else if (m.stage === 'results') {
      m.stage = 'eject';
      m.stageEndsAt = t + 7000;
      const e = this.players.get(m.ejectedId);
      let text;
      const impLeft = () => this.alivePlayers().filter((q) => q.team === 'impostor' && q.id !== m.ejectedId).length;
      if (!e) text = m.tie ? 'No one was ejected. (Tie)' : 'No one was ejected. (Skipped)';
      else if (this.settings.confirmEjects) {
        const isImp = e.team === 'impostor';
        text = `${e.name} was ${isImp ? '' : 'not '}an Impostor.`;
        if (e.role !== 'crewmate' && e.role !== 'impostor') text = `${e.name} was the ${C.ROLES[e.role].name}.` + (isImp ? ' (Impostor)' : '');
      } else text = `${e.name} was ejected.`;
      const sub = this.settings.confirmEjects && this.game.numImpostors > 0 ? `${impLeft()} Impostor${impLeft() === 1 ? '' : 's'} remain${impLeft() === 1 ? 's' : ''}.` : '';
      if (e) { e.alive = false; e.diedAt = t; if (e.role === 'guardian') { e.ghostRole = 'guardian'; e.abilityCooldownEnd = t + 5000; } }
      this.emitAll('eject', { player: e ? this.profileOf(e) : null, text, sub });
      if (e) e.socket.emit('youDied', { ejected: true, ghostRole: e.ghostRole });
    } else if (m.stage === 'eject') {
      this.game.meeting = null;
      if (this.checkWin()) return;
      this.endMeeting();
    }
  }

  endMeeting() {
    const t = now();
    const g = this.game;
    this.phase = 'playing';
    const list = [...this.players.values()];
    list.forEach((q, i) => {
      const sp = this.map.spawnPoint(i, list.length);
      q.x = sp.x; q.y = sp.y; q.lastMove = t;
      q.killCooldownEnd = t + this.settings.killCooldown * 1000;
      if (q.role === 'shapeshifter' || q.role === 'phantom') q.abilityCooldownEnd = t + 10000;
    });
    g.emergencyCooldownEnd = t + this.settings.emergencyCooldown * 1000;
    this.emitAll('meetingEnd', { positions: list.map((q) => ({ id: q.id, x: q.x, y: q.y })) });
  }

  // ------------------------------------------------------------------ win / end
  checkWin() {
    const g = this.game;
    if (!g || g.over || this.phase === 'lobby') return false;
    if (g.meeting) return false; // evaluated once the meeting ends
    const alive = this.alivePlayers();
    const imp = alive.filter((q) => q.team === 'impostor').length;
    const crew = alive.length - imp;
    if (g.numImpostors > 0 && imp === 0) return this.endGame('crew', 'All Impostors have been ejected.');
    if (g.numImpostors > 0 && imp >= crew) return this.endGame('impostor', 'The Impostors outnumber the crew.');
    if (g.tasksTotal > 0 && g.tasksDone >= g.tasksTotal) return this.endGame('crew', 'The crew completed every task.');
    if (alive.length === 0) return this.endGame('impostor', 'No crew survived.');
    return false;
  }

  endGame(winner, reason) {
    const g = this.game;
    if (!g || g.over) return true;
    g.over = true;
    this.phase = 'ended';
    this.emitAll('gameOver', {
      winner, reason,
      players: [...this.players.values()].map((q) => ({ ...this.profileOf(q), role: q.role, team: q.team, alive: q.alive })),
    });
    g.endTimer = setTimeout(() => this.backToLobby(), 9000);
    return true;
  }

  backToLobby() {
    this.phase = 'lobby';
    this.game = null;
    this.map = MAPS.lobby;
    for (const q of this.players.values()) {
      const sp = this.map.spawnPoint(Math.floor(Math.random() * 12), 12);
      Object.assign(q, { x: sp.x, y: sp.y, alive: true, role: null, team: null, tasks: [], inVent: null, lastMove: now() });
    }
    this.emitAll('backToLobby', {});
    this.broadcastState();
  }

  // ------------------------------------------------------------------ tick
  tick() {
    if (this.players.size === 0) return;
    const t = now();
    const g = this.game;
    if (g && !g.over) {
      if (this.phase === 'meeting') this.meetingTick(t);
      if (this.phase === 'playing') {
        for (const q of this.players.values()) {
          if (q.shiftInto && t >= q.shiftEnd) this.unshift(q);
          if (q.invisibleUntil && t >= q.invisibleUntil) this.appear(q);
          if (q.inVent && q.role === 'engineer' && t >= q.ventExitAt) this.exitVent(q);
          if (q.trackUntil && t >= q.trackUntil) { q.trackTarget = null; q.trackUntil = 0; }
        }
        g.bodies = g.bodies.filter((b) => !b.dissolveAt || t < b.dissolveAt);
        for (const r in g.doors) if (g.doors[r] <= t) delete g.doors[r];
        const s = g.sabotage;
        if (s && s.type === 'reactor') {
          for (const k of ['reactorA', 'reactorB']) {
            const h = this.players.get(s.held[k]);
            if (s.held[k] && (!h || !h.alive || dist(h, this.map.stations[k]) > C.USE_RANGE + 60)) s.held[k] = null;
          }
        }
        if (s && s.endsAt && t >= s.endsAt) {
          this.endGame('impostor', s.type === 'reactor' ? 'The reactor melted down.' : 'The oxygen ran out.');
          return;
        }
      }
    }
    if (this.phase === 'lobby' || this.phase === 'playing') this.sendSnapshots(t);
  }

  sendSnapshots(t) {
    const g = this.game;
    const all = [...this.players.values()];
    const S = this.settings;
    let shared = { t, phase: this.phase };
    if (g && this.phase === 'playing') {
      const s = g.sabotage;
      shared.sab = s ? {
        type: s.type, left: s.endsAt ? s.endsAt - t : null,
        held: s.held ? { reactorA: !!s.held.reactorA, reactorB: !!s.held.reactorB } : undefined,
        fixed: s.fixed, code: s.code,
      } : null;
      shared.doors = Object.keys(g.doors);
      shared.bodies = g.bodies.map((b) => ({ id: b.id, x: b.x, y: b.y, color: b.color, victimId: b.victimId, d: b.dissolveAt ? Math.max(0, b.dissolveAt - t) : 0 }));
      const prog = S.taskBarUpdates === 0 ? g.tasksDone : S.taskBarUpdates === 1 ? g.progressShown : null;
      shared.progress = s && s.type === 'comms' ? null : (prog === null ? null : (g.tasksTotal ? prog / g.tasksTotal : 0));
      shared.emergencyCd = Math.max(0, g.emergencyCooldownEnd - t);
      shared.sabCd = Math.max(0, g.sabotageCooldownEnd - t);
      shared.doorCd = {};
      for (const r in g.doorCooldown) if (g.doorCooldown[r] > t) shared.doorCd[r] = g.doorCooldown[r] - t;
    }
    for (const r of all) {
      const rIsGhost = g && !r.alive;
      const players = [];
      for (const p of all) {
        if (g && p.id !== r.id) {
          if (!p.alive && !rIsGhost) continue;
          if (p.inVent) continue;
          if (p.invisibleUntil > t && r.team !== 'impostor' && !rIsGhost) continue;
        }
        const e = { id: p.id, x: Math.round(p.x), y: Math.round(p.y), d: p.dir, m: p.moving ? 1 : 0 };
        if (g) {
          e.a = p.alive ? 1 : 0;
          if (p.shiftInto) e.s = p.shiftInto;
          if (p.invisibleUntil > t) e.inv = 1;
          if (p.scanning && S.visualTasks) e.sc = 1;
          if (p.protectedUntil > t && (r.id === p.id || r.id === p.protectedBy || rIsGhost)) e.sh = 1;
        }
        players.push(e);
      }
      const snap = { ...shared, players };
      if (g && this.phase === 'playing') {
        const me = {
          kill: Math.max(0, r.killCooldownEnd - t), ability: Math.max(0, r.abilityCooldownEnd - t),
          vent: Math.max(0, r.ventCooldownEnd - t), inVent: r.inVent, emergencies: r.emergencyLeft,
        };
        if (r.role === 'engineer' && r.inVent) me.ventLeft = Math.max(0, r.ventExitAt - t);
        if (r.shiftInto) me.shiftLeft = r.shiftEnd - t;
        if (r.invisibleUntil > t) me.vanishLeft = r.invisibleUntil - t;
        if (r.trackTarget) {
          const tq = this.players.get(r.trackTarget);
          if (tq && tq.alive) me.track = { x: Math.round(tq.x), y: Math.round(tq.y), name: tq.name, left: r.trackUntil - t };
        }
        if (r.vitalsUntil > t) { me.vitals = this.vitals(); me.vitalsLeft = r.vitalsUntil - t; }
        snap.me = me;
      }
      r.socket.emit('snap', snap);
    }
  }
}

module.exports = { Room };
