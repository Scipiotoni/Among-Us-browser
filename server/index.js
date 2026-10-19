const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { Room } = require('./room');

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));
app.get('/health', (req, res) => res.send('ok'));

const server = http.createServer(app);
// Allow any origin so the page can also be hosted elsewhere (e.g. GitHub Pages).
const io = new Server(server, { cors: { origin: true } });

const manager = {
  io,
  rooms: new Map(),
  makeCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code;
    do { code = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join(''); }
    while (this.rooms.has(code));
    return code;
  },
  deleteRoom(code) {
    const r = this.rooms.get(code);
    if (r) r.destroy();
    this.rooms.delete(code);
  },
};

io.on('connection', (socket) => {
  const room = () => socket.data.room;
  const me = () => room() && room().players.get(socket.id);
  // Wrap handlers so a bad payload can never crash the server.
  const on = (ev, fn) => socket.on(ev, (...args) => {
    try { fn(...args); } catch (e) { console.error(`[${ev}]`, e); }
  });
  const inRoom = (ev, fn) => on(ev, (...args) => { const p = me(); if (p) fn(room(), p, ...args); });

  on('listRooms', (cb) => {
    if (typeof cb !== 'function') return;
    cb([...manager.rooms.values()].filter((r) => r.settings.isPublic && !r.locked).map((r) => r.listing()));
  });

  on('createRoom', ({ profile, clientId } = {}, cb) => {
    if (typeof cb !== 'function' || room()) return;
    const code = manager.makeCode();
    const r = new Room(manager, code);
    manager.rooms.set(code, r);
    r.addPlayer(socket, profile, String(clientId || socket.id));
    cb({ ok: true, code, id: socket.id });
  });

  on('joinRoom', ({ code, profile, clientId } = {}, cb) => {
    if (typeof cb !== 'function' || room()) return;
    const r = manager.rooms.get(String(code || '').toUpperCase().trim());
    if (!r) return cb({ error: 'Lobby not found. Check the code.' });
    const err = r.canJoin(String(clientId || socket.id));
    if (err) return cb({ error: err });
    r.addPlayer(socket, profile, String(clientId || socket.id));
    cb({ ok: true, code: r.code, id: socket.id });
  });

  inRoom('leaveRoom', (r, p) => r.removePlayer(p.id));
  inRoom('profile', (r, p, prof) => r.onProfile(p, prof));
  inRoom('chat', (r, p, text) => r.onChat(p, text));
  inRoom('settings', (r, p, s) => r.onSettings(p, s));
  inRoom('admin', (r, p, a) => r.onAdmin(p, a));
  inRoom('start', (r, p) => r.startGame(p));
  inRoom('move', (r, p, d) => r.onMove(p, d));
  inRoom('kill', (r, p, id) => r.onKill(p, id));
  inRoom('report', (r, p, id) => r.onReport(p, id));
  inRoom('emergency', (r, p) => r.onEmergency(p));
  inRoom('task', (r, p, d) => r.onTask(p, d));
  inRoom('scan', (r, p, on) => r.onScan(p, on));
  inRoom('vent', (r, p, d) => r.onVent(p, d));
  inRoom('sabotage', (r, p, d) => r.onSabotage(p, d));
  inRoom('fix', (r, p, d) => r.onFix(p, d));
  inRoom('ability', (r, p, d) => r.onAbility(p, d));
  inRoom('vote', (r, p, target) => r.onVote(p, target));
  inRoom('console', (r, p, d, cb) => r.onConsole(p, d, cb));

  on('disconnect', () => { const r = room(); if (r) r.removePlayer(socket.id, 'disconnected'); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sus Station running on http://localhost:${PORT}`));
