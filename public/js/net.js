// Serverless multiplayer, the same approach as Casino-simulator: players talk through a free
// public MQTT broker, and the browser that creates a lobby runs the game (RoomLogic.Room) for it.
// Net mimics the small part of the Socket.IO client the game uses: emit(ev, ...args, cb?) and on(ev, fn).
//
// Topics (under PREFIX):
//   lobbies/<code>  retained listing of public lobbies
//   r/<code>/h      messages to the lobby host     { f: sender, e: event, a: args, r: reply id }
//   r/<code>/a      broadcasts from the host       { e: event, d: data }
//   u/<id>          messages to one player         { e, d } or { e: '_cb', r, d } for replies
//   bye/<id>        last will, published by the broker when a player's connection drops
const Net = (() => {
  const PREFIX = 'browser-imposter/scipiotoni/v1';
  const q = new URLSearchParams(location.search).get('mqtt');
  const BROKERS = q && /^wss?:\/\//.test(q) ? [q]
    : (window.MQTT_BROKERS || ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt']);
  const ID = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const LISTING_MAX_AGE = 25000;
  const PEER_TIMEOUT = 20000;

  const handlers = new Map();
  const pending = new Map();
  let client = null, brokerIdx = 0, connected = false, nextReq = 1;
  let mode = null, code = null, hostId = null, room = null, lastHost = 0;
  let stopHostTimers = null, stopGuestTimers = null, listingCollector = null;
  const lastSeen = new Map();

  // ------------------------------------------------------------------ local events
  function fire(ev, ...args) {
    for (const fn of handlers.get(ev) || []) {
      try { fn(...args); } catch (e) { console.error(`[${ev}]`, e); }
    }
  }
  const fireLater = (ev, d) => queueMicrotask(() => fire(ev, d));

  // ------------------------------------------------------------------ broker connection
  function start() {
    const attempt = () => {
      const url = BROKERS[brokerIdx++ % BROKERS.length];
      const c = new MqttClient({ url, clientId: `bi-${ID}`, keepAlive: 30, will: { topic: `${PREFIX}/bye/${ID}`, payload: 'x' } });
      const timer = setTimeout(() => { if (!c.connected) { c.close(); attempt(); } }, 8000);
      c.onConnect = () => {
        clearTimeout(timer);
        client = c;
        connected = true;
        fire('connect');
      };
      c.onClose = () => { connected = false; fire('disconnect'); };
      c.onMessage = onMessage;
      c.subscribe(`${PREFIX}/u/${ID}`);
      c.connect();
    };
    attempt();
  }

  const send = (topic, obj, retain) => client && client.publish(topic, obj === '' ? '' : JSON.stringify(obj), retain);
  const sendTo = (id, e, d) => send(`${PREFIX}/u/${id}`, { e, d });

  function onMessage(topic, payload) {
    const rest = topic.slice(PREFIX.length + 1);
    if (rest.startsWith('lobbies/')) {
      if (listingCollector && payload) { try { listingCollector.push(JSON.parse(payload)); } catch (e) { /* ignore junk */ } }
      return;
    }
    if (rest.startsWith('bye/')) {
      const id = rest.slice(4);
      if (mode === 'host' && room && room.players.has(id)) room.removePlayer(id, 'disconnected');
      if (mode === 'guest' && id === hostId) hostGone('The host left, so the lobby closed.');
      return;
    }
    let msg;
    try { msg = JSON.parse(payload); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    if (rest === `u/${ID}`) {
      if (msg.e === '_cb') {
        const p = pending.get(msg.r);
        if (p) { pending.delete(msg.r); clearTimeout(p.timer); p.cb(msg.d); }
        return;
      }
      if (mode === 'guest') lastHost = Date.now();
      return fire(msg.e, msg.d);
    }
    if (code && rest === `r/${code}/a` && (mode === 'guest' || mode === 'joining')) {
      lastHost = Date.now();
      return fire(msg.e, msg.d);
    }
    if (code && rest === `r/${code}/h` && mode === 'host') {
      const from = String(msg.f || '');
      if (!from || from === ID) return;
      hostHandle(from, String(msg.e || ''), Array.isArray(msg.a) ? msg.a : [], msg.r ? (d) => send(`${PREFIX}/u/${from}`, { e: '_cb', r: msg.r, d }) : null);
    }
  }

  // ------------------------------------------------------------------ hosting
  function makeCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  }

  function socketFor(id) {
    if (id === ID) return { id, emit: (e, d) => fireLater(e, d), join() {}, leave() {}, data: {} };
    return { id, emit: (e, d) => sendTo(id, e, d), join() {}, leave() {}, data: {} };
  }

  function createHost(profile, clientId) {
    code = makeCode();
    mode = 'host';
    hostId = ID;
    const manager = {
      io: { to: () => ({ emit: (e, d) => { send(`${PREFIX}/r/${code}/a`, { e, d }); fireLater(e, d); } }) },
      deleteRoom: () => closeHost(),
      every: BgTimer.every,
    };
    room = new RoomLogic.Room(manager, code);
    client.subscribe(`${PREFIX}/r/${code}/h`);
    room.addPlayer(socketFor(ID), profile, clientId);
    const stopListing = BgTimer.every(4000, publishListing);
    const stopHb = BgTimer.every(3000, () => send(`${PREFIX}/r/${code}/a`, { e: 'hb' }));
    const stopReap = BgTimer.every(2000, () => {
      const now = Date.now();
      for (const id of [...room.players.keys()]) {
        if (id !== ID && now - (lastSeen.get(id) || now) > PEER_TIMEOUT) room.removePlayer(id, 'timed out');
      }
    });
    stopHostTimers = () => { stopListing(); stopHb(); stopReap(); };
    publishListing();
  }

  function publishListing() {
    if (mode !== 'host' || !room) return;
    const open = room.settings.isPublic && !room.locked && room.phase === 'lobby' && room.players.size < room.settings.maxPlayers;
    send(`${PREFIX}/lobbies/${code}`, open ? { ...room.listing(), at: Date.now() } : '', true);
  }

  function closeHost() {
    if (mode !== 'host') return;
    const r = room, c = code;
    room = null;
    if (stopHostTimers) stopHostTimers();
    send(`${PREFIX}/r/${c}/a`, { e: 'kicked', d: { reason: 'The host closed the lobby.' } });
    send(`${PREFIX}/lobbies/${c}`, '', true);
    if (client) client.unsubscribe(`${PREFIX}/r/${c}/h`);
    for (const id of lastSeen.keys()) if (client) client.unsubscribe(`${PREFIX}/bye/${id}`);
    lastSeen.clear();
    reset();
    if (r) r.destroy();
  }

  // Runs on the host for every message from a player (and for the host's own actions).
  function hostHandle(from, ev, a, reply) {
    const r = room;
    if (!r) return;
    try {
      if (ev === 'join') {
        const { profile, clientId } = a[0] || {};
        if (r.players.has(from)) return reply && reply({ ok: true, code: r.code, id: from, hostId: ID });
        const err = r.canJoin(String(clientId || from));
        if (err) return reply && reply({ error: err });
        lastSeen.set(from, Date.now());
        client.subscribe(`${PREFIX}/bye/${from}`);
        r.addPlayer(socketFor(from), profile, String(clientId || from));
        publishListing();
        return reply && reply({ ok: true, code: r.code, id: from, hostId: ID });
      }
      const p = r.players.get(from);
      if (!p) { if (from !== ID && ev !== 'hb') sendTo(from, 'kicked', { reason: 'You are no longer in this lobby.' }); return; }
      lastSeen.set(from, Date.now());
      switch (ev) {
        case 'hb': break;
        case 'leaveRoom': r.removePlayer(p.id); publishListing(); break;
        case 'profile': r.onProfile(p, a[0]); break;
        case 'chat': r.onChat(p, a[0]); break;
        case 'settings': r.onSettings(p, a[0]); publishListing(); break;
        case 'admin': r.onAdmin(p, a[0]); publishListing(); break;
        case 'start': r.startGame(p); publishListing(); break;
        case 'move': r.onMove(p, a[0]); break;
        case 'kill': r.onKill(p, a[0]); break;
        case 'report': r.onReport(p, a[0]); break;
        case 'emergency': r.onEmergency(p); break;
        case 'task': r.onTask(p, a[0]); break;
        case 'scan': r.onScan(p, a[0]); break;
        case 'vent': r.onVent(p, a[0]); break;
        case 'sabotage': r.onSabotage(p, a[0]); break;
        case 'fix': r.onFix(p, a[0]); break;
        case 'ability': r.onAbility(p, a[0]); break;
        case 'vote': r.onVote(p, a[0]); break;
        case 'console': r.onConsole(p, a[0], reply || (() => {})); break;
      }
      if (r.players.size && r.phase !== 'lobby') publishListing();
    } catch (e) { console.error(`[host ${ev}]`, e); }
  }

  // ------------------------------------------------------------------ joining
  function joinRoom(c, payload, cb) {
    code = c;
    mode = 'joining';
    client.subscribe(`${PREFIX}/r/${c}/a`);
    request(`${PREFIX}/r/${c}/h`, 'join', [payload], 6000, (res) => {
      if (!res) res = { error: 'Lobby not found. Check the code (and that the host is still online).' };
      if (res.error) { client.unsubscribe(`${PREFIX}/r/${c}/a`); reset(); return cb(res); }
      mode = 'guest';
      hostId = res.hostId;
      lastHost = Date.now();
      client.subscribe(`${PREFIX}/bye/${hostId}`);
      const stopHb = BgTimer.every(3000, () => send(`${PREFIX}/r/${code}/h`, { f: ID, e: 'hb', a: [] }));
      const stopWatch = BgTimer.every(2000, () => { if (Date.now() - lastHost > PEER_TIMEOUT) hostGone('Lost connection to the host, so the lobby closed.'); });
      stopGuestTimers = () => { stopHb(); stopWatch(); };
      cb(res);
    });
  }

  function hostGone(reason) {
    if (mode !== 'guest') return;
    leaveGuest();
    fire('kicked', { reason });
  }

  function leaveGuest() {
    if (stopGuestTimers) stopGuestTimers();
    if (client) {
      client.unsubscribe(`${PREFIX}/r/${code}/a`);
      if (hostId) client.unsubscribe(`${PREFIX}/bye/${hostId}`);
    }
    reset();
  }

  function reset() { mode = null; code = null; hostId = null; stopGuestTimers = null; stopHostTimers = null; }

  function request(topic, e, a, timeoutMs, cb) {
    const r = `${ID}-${nextReq++}`;
    const timer = setTimeout(() => { pending.delete(r); cb(null); }, timeoutMs);
    pending.set(r, { cb, timer });
    send(topic, { f: ID, e, a, r });
  }

  function listRooms(cb) {
    const found = [];
    listingCollector = found;
    client.subscribe(`${PREFIX}/lobbies/+`);
    setTimeout(() => {
      if (client) client.unsubscribe(`${PREFIX}/lobbies/+`);
      listingCollector = null;
      const now = Date.now(), seen = new Set();
      cb(found.filter((l) => l && l.code && now - (l.at || 0) < LISTING_MAX_AGE && !seen.has(l.code) && seen.add(l.code)));
    }, 1500);
  }

  // ------------------------------------------------------------------ socket-like API
  return {
    PREFIX, BROKERS, ID, start,
    get connected() { return connected; },
    get isHost() { return mode === 'host'; },
    on(ev, fn) { if (!handlers.has(ev)) handlers.set(ev, []); handlers.get(ev).push(fn); },
    emit(ev, ...args) {
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      if (!connected) { if (cb && ev !== 'console') cb({ error: 'Not connected yet. Try again in a moment.' }); return; }
      if (ev === 'listRooms') return listRooms(cb);
      if (ev === 'createRoom') {
        if (mode) return;
        createHost((args[0] || {}).profile, String((args[0] || {}).clientId || ID));
        return cb && cb({ ok: true, code, id: ID });
      }
      if (ev === 'joinRoom') {
        if (mode) return;
        const c = String((args[0] || {}).code || '').toUpperCase().trim();
        return joinRoom(c, { profile: (args[0] || {}).profile, clientId: (args[0] || {}).clientId }, cb || (() => {}));
      }
      if (ev === 'leaveRoom') {
        if (mode === 'host') return closeHost();
        if (mode === 'guest') { send(`${PREFIX}/r/${code}/h`, { f: ID, e: 'leaveRoom', a: [] }); leaveGuest(); }
        return;
      }
      if (mode === 'host') return hostHandle(ID, ev, args, cb);
      if (mode === 'guest') {
        if (cb) request(`${PREFIX}/r/${code}/h`, ev, args, 6000, (res) => cb(res || { error: 'No answer from the host.' }));
        else send(`${PREFIX}/r/${code}/h`, { f: ID, e: ev, a: args });
      }
    },
  };
})();
