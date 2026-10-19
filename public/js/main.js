// App bootstrap: profile storage, socket wiring, screen switching.
const App = (() => {
  const $ = (id) => document.getElementById(id);
  const C = SHARED;

  function loadProfile() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem('sus_profile') || '{}'); } catch (e) {}
    return {
      name: p.name || '',
      color: p.color || C.COLORS[Math.floor(Math.random() * C.COLORS.length)].id,
      hat: p.hat || 'none', eyes: p.eyes || 'normal', outfit: p.outfit || 'none', pet: p.pet || 'none',
    };
  }
  function clientId() {
    let id = null;
    try { id = localStorage.getItem('sus_client'); } catch (e) {}
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem('sus_client', id); } catch (e) {} }
    return id;
  }

  const App = {
    socket: io(),
    profile: loadProfile(),
    room: null,
    myId: null,
    isAdmin() { return !!this.room && (this.room.hostId === this.myId || this.room.admins.includes(this.myId)); },
    setProfile(patch) {
      Object.assign(this.profile, patch);
      try { localStorage.setItem('sus_profile', JSON.stringify(this.profile)); } catch (e) {}
      if (this.room && this.room.phase === 'lobby') {
        clearTimeout(this._pt);
        this._pt = setTimeout(() => this.socket.emit('profile', this.profile), 150);
      }
    },
    create() {
      if (!this.checkName()) return;
      this.socket.emit('createRoom', { profile: this.profile, clientId: clientId() }, (res) => this.joined(res));
    },
    join(code) {
      if (!this.checkName()) return;
      code = String(code || '').trim().toUpperCase();
      if (code.length !== 5) return UI.toast('Enter a 5-letter lobby code.', 'warn');
      this.socket.emit('joinRoom', { code, profile: this.profile, clientId: clientId() }, (res) => this.joined(res));
    },
    checkName() {
      if (!this.profile.name.trim()) { UI.toast('Pick a name first!', 'warn'); $('name-input').focus(); return false; }
      Sfx.unlock();
      return true;
    },
    joined(res) {
      if (!res || res.error) return UI.toast(res ? res.error : 'Could not connect.', 'bad');
      this.myId = res.id;
      history.replaceState(null, '', `?code=${res.code}`);
      showScreen('game');
      UI.clearChat();
      Game.enterLobby(this.myId, this.room ? this.room.players : []);
      UI.renderLobby();
      UI.updateChatAvailability();
      UI.toast(`Joined lobby ${res.code}`, 'good');
    },
    leave() {
      this.socket.emit('leaveRoom');
      this.toMenu();
    },
    toMenu() {
      this.room = null;
      Game.exitToMenu();
      UI.closeModals();
      UI.meetingEnd();
      UI.hideGameOver();
      document.querySelectorAll('.overlay').forEach((o) => o.classList.add('hidden'));
      history.replaceState(null, '', location.pathname);
      showScreen('menu');
    },
  };

  function showScreen(name) {
    $('screen-menu').classList.toggle('hidden', name !== 'menu');
    $('screen-game').classList.toggle('hidden', name !== 'game');
    document.body.classList.toggle('in-game', name === 'game');
  }

  // ------------------------------------------------------------------ socket events
  const s = App.socket;
  s.on('connect', () => $('conn-status').classList.add('hidden'));
  s.on('disconnect', () => {
    $('conn-status').classList.remove('hidden');
    if (App.room) { UI.toast('Disconnected from server.', 'bad'); App.toMenu(); }
  });
  s.on('roomState', (r) => {
    const prevPhase = App.room && App.room.phase;
    App.room = r;
    Game.setProfiles(r.players);
    UI.renderLobby();
    UI.updateChatAvailability();
    if (prevPhase && prevPhase !== r.phase) Game.updateHud(true);
  });
  s.on('chat', (m) => UI.addChat(m));
  s.on('toast', (t) => UI.toast(t.text, t.kind));
  s.on('kicked', (d) => { App.toMenu(); UI.toast(d.reason, 'bad'); });
  s.on('snap', (d) => Game.onSnap(d));
  s.on('teleport', (d) => Game.teleport(d.x, d.y));
  s.on('gameStart', (d) => {
    UI.closeModals();
    UI.toggleChat(false);
    Game.startMatch(d);
    UI.roleReveal(d);
    UI.updateChatAvailability();
  });
  s.on('tasks', (t) => { Game.setTasks(t); Sfx.task(); });
  s.on('vent', (d) => Game.onVent(d));
  s.on('ventFx', (d) => { Game.addFx({ type: 'vent', vent: d.vent }); const v = Game.S.map && Game.S.map.ventById[d.vent]; if (v && Math.hypot(v.x - Game.S.me.x, v.y - Game.S.me.y) < 500) Sfx.vent(); });
  s.on('doorsFx', (d) => {
    const r = Game.S.map.roomById[d.room];
    if (r && Game.S.map.roomAt(Game.S.me.x, Game.S.me.y) === r) UI.toast('The doors slammed shut!', 'warn');
    Sfx.door();
  });
  s.on('shiftFx', () => Sfx.poof());
  s.on('vanishFx', () => Sfx.poof());
  s.on('killFx', () => { Sfx.kill(); document.body.classList.add('flash'); setTimeout(() => document.body.classList.remove('flash'), 200); });
  s.on('youDied', (d) => { Game.onDeath(d); UI.killScreen(d); UI.updateChatAvailability(); });
  s.on('noise', (d) => { Game.addNoise(d); Sfx.alarm(); UI.toast(`📢 ${d.name}'s body made a noise!`, 'warn'); });
  s.on('shielded', () => { Sfx.shield(); UI.toast('Your target was protected by a Guardian!', 'warn'); });
  s.on('clue', (d) => UI.showClue(d));
  s.on('sabotage', (d) => {
    Sfx.sabotage();
    const names = { reactor: '☢️ Reactor meltdown!', o2: '💨 Oxygen depleting!', lights: '💡 The lights went out!', comms: '📡 Communications down!' };
    UI.toast(names[d.type], 'bad');
  });
  s.on('sabotageFixed', () => { UI.toast('Sabotage repaired.', 'good'); Sfx.good(); });
  s.on('meeting', (d) => { Game.meetingStarted(); UI.meetingStart(d); });
  s.on('meetingStage', (d) => UI.meetingStage(d));
  s.on('voted', (d) => UI.onVoted(d));
  s.on('voteResults', (d) => UI.voteResults(d));
  s.on('eject', (d) => UI.eject(d));
  s.on('meetingEnd', (d) => { UI.meetingEnd(); Game.meetingEnded(d.positions); });
  s.on('playerLeft', () => {});
  s.on('gameOver', (d) => { Game.setFrozen(true); Game.closeMap(); Game.closeConsole(); Tasks.close(); UI.gameOver(d); });
  s.on('backToLobby', () => {
    UI.hideGameOver();
    document.querySelectorAll('.overlay').forEach((o) => o.classList.add('hidden'));
    Game.enterLobby(App.myId, App.room ? App.room.players : []);
    UI.updateChatAvailability();
  });

  // ------------------------------------------------------------------ boot
  window.addEventListener('DOMContentLoaded', () => {
    Game.init();
    UI.initMenu();
    UI.initLobby();
    const code = new URLSearchParams(location.search).get('code');
    if (code) $('code-input').value = code.toUpperCase();
    showScreen('menu');
  });

  return App;
})();
