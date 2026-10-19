// DOM UI: menu, wardrobe, settings, lobby admin, chat, meetings and overlays.
const UI = (() => {
  const C = SHARED;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MODALS = ['modal-customize', 'modal-settings', 'modal-players', 'modal-picker', 'modal-clue', 'modal-help'];

  function portraitCanvas(prof, size = 64, opts) {
    const c = el('canvas', 'portrait');
    c.width = size; c.height = size;
    Draw.portrait(c, prof, opts);
    return c;
  }

  // ------------------------------------------------------------------ toasts
  function toast(text, kind) {
    const t = el('div', 'toast ' + (kind || ''), esc(text));
    $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  }

  // ------------------------------------------------------------------ modals
  function openModal(id) { $(id).classList.remove('hidden'); }
  function closeModal(id) { $(id).classList.add('hidden'); }
  function closeModals() { MODALS.forEach(closeModal); }
  function modalOpen() {
    return MODALS.some((id) => !$(id).classList.contains('hidden')) || !$('meeting').classList.contains('hidden');
  }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) closeModal(c.dataset.close);
  });

  // ------------------------------------------------------------------ menu
  function initMenu() {
    const name = $('name-input');
    name.value = App.profile.name || '';
    name.addEventListener('input', () => { App.setProfile({ name: name.value }); });
    $('btn-customize').onclick = () => openCustomize();
    $('btn-create').onclick = () => App.create();
    $('btn-join').onclick = () => App.join($('code-input').value);
    $('code-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') App.join($('code-input').value); });
    $('code-input').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
    $('btn-browse').onclick = () => browse();
    $('btn-help').onclick = () => openModal('modal-help');
    const pv = $('menu-preview');
    const loop = (t) => {
      if (!$('screen-menu').classList.contains('hidden')) Draw.portrait(pv, App.profile, { phase: t / 1000, pet: true });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function browse() {
    const box = $('lobby-list');
    box.classList.remove('hidden');
    box.innerHTML = '<div class="muted">Searching…</div>';
    App.socket.emit('listRooms', (rooms) => {
      box.innerHTML = '';
      const open = rooms.filter((r) => r.phase === 'lobby' && r.players < r.max);
      if (!open.length) { box.innerHTML = '<div class="muted">No public lobbies right now. Create one!</div>'; return; }
      for (const r of open) {
        const row = el('button', 'lobby-row', `<b>${esc(r.host)}'s lobby</b><span>${r.players}/${r.max} players · ${r.impostors} impostor${r.impostors > 1 ? 's' : ''}</span><code>${r.code}</code>`);
        row.onclick = () => App.join(r.code);
        box.appendChild(row);
      }
    });
  }

  // ------------------------------------------------------------------ wardrobe
  let czTab = 'color';
  function openCustomize() {
    openModal('modal-customize');
    $('cz-name').value = App.profile.name || '';
    $('cz-name').oninput = (e) => { App.setProfile({ name: e.target.value }); $('name-input').value = e.target.value; };
    document.querySelectorAll('.cz-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === czTab);
      b.onclick = () => { czTab = b.dataset.tab; openCustomize(); };
    });
    renderCzGrid();
    const pv = $('cz-preview');
    const loop = (t) => {
      if ($('modal-customize').classList.contains('hidden')) return;
      Draw.portrait(pv, App.profile, { phase: t / 1000, pet: true });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function renderCzGrid() {
    const grid = $('cz-grid');
    grid.innerHTML = '';
    const lists = { color: C.COLORS, hat: C.HATS, eyes: C.EYES, outfit: C.OUTFITS, pet: C.PETS };
    const taken = new Set(App.room ? App.room.players.filter((p) => p.id !== App.myId).map((p) => p.color) : []);
    for (const item of lists[czTab]) {
      const sel = App.profile[czTab] === item.id;
      const b = el('button', 'cz-item' + (sel ? ' selected' : ''));
      b.title = item.name;
      if (czTab === 'color') {
        const c = Draw.col(item.id);
        b.style.background = `linear-gradient(160deg, ${c.body}, ${c.shade})`;
        b.classList.add('swatch');
        if (taken.has(item.id)) { b.classList.add('taken'); b.disabled = true; }
      } else {
        const prof = { ...App.profile, [czTab]: item.id };
        b.appendChild(portraitCanvas(prof, 72, { pet: czTab === 'pet' }));
        b.appendChild(el('small', '', esc(item.name)));
      }
      b.onclick = () => { App.setProfile({ [czTab]: item.id }); renderCzGrid(); };
      grid.appendChild(b);
    }
  }

  // ------------------------------------------------------------------ settings
  function openSettings() {
    openModal('modal-settings');
    renderSettings();
  }
  function stepper(value, f, onChange, disabled) {
    const w = el('div', 'stepper');
    const fmt = (v) => f.type === 'bool' ? (v ? 'On' : 'Off') : f.type === 'select' ? f.options[v] : `${+(+v).toFixed(2)}${f.unit || ''}`;
    const minus = el('button', '', '−'), plus = el('button', '', '+'), val = el('span', 'val', fmt(value));
    minus.disabled = plus.disabled = disabled;
    const change = (dir) => {
      let v = value;
      if (f.type === 'bool') v = !v;
      else if (f.type === 'select') v = (v + dir + f.options.length) % f.options.length;
      else v = Math.max(f.min, Math.min(f.max, Math.round((v + dir * f.step) * 100) / 100));
      value = v;
      val.textContent = fmt(v);
      onChange(v);
    };
    minus.onclick = () => change(-1);
    plus.onclick = () => change(1);
    w.append(minus, val, plus);
    return w;
  }
  let pendingSettings = null, settingsTimer = null;
  function pushSettings(patch) {
    pendingSettings = Object.assign(pendingSettings || {}, patch);
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => { App.socket.emit('settings', pendingSettings); pendingSettings = null; }, 250);
  }
  function renderSettings() {
    if (!App.room) return;
    const s = App.room.settings;
    const admin = App.isAdmin();
    const body = $('settings-body');
    body.innerHTML = '';
    $('settings-note').textContent = admin ? 'Changes apply instantly for everyone in the lobby.' : 'Only the host and admins can change settings.';
    for (const f of C.SETTINGS_SCHEMA) {
      if (f.group) { body.appendChild(el('h3', '', f.group)); continue; }
      const row = el('div', 'set-row', `<label>${f.label}</label>`);
      row.appendChild(stepper(s[f.key], f, (v) => pushSettings({ [f.key]: v }), !admin));
      body.appendChild(row);
    }
    body.appendChild(el('h3', '', 'Roles'));
    body.appendChild(el('p', 'muted', 'Count = how many players can get the role. Chance = % chance per slot.'));
    const roleList = [...C.SPECIAL_CREW, ...C.SPECIAL_IMPOSTOR];
    for (const r of roleList) {
      const R = C.ROLES[r], cfg = s.roles[r];
      const card = el('div', 'role-card');
      const head = el('div', 'role-head', `<b style="color:${R.color}">${R.name}</b><span class="team ${R.team}">${R.team === 'crew' ? 'Crew' : 'Impostor'}</span><p>${R.desc}</p>`);
      card.appendChild(head);
      const row = el('div', 'role-steppers');
      const cnt = el('div', 'mini', '<label>Count</label>');
      cnt.appendChild(stepper(cfg.count, { min: 0, max: R.team === 'impostor' ? 3 : 5, step: 1 }, (v) => pushSettings({ roles: { [r]: { count: v } } }), !admin));
      const ch = el('div', 'mini', '<label>Chance</label>');
      ch.appendChild(stepper(cfg.chance, { min: 0, max: 100, step: 10, unit: '%' }, (v) => pushSettings({ roles: { [r]: { chance: v } } }), !admin));
      row.append(cnt, ch);
      for (const o of R.options || []) {
        const m = el('div', 'mini', `<label>${o.label}</label>`);
        m.appendChild(stepper(cfg[o.key], o, (v) => pushSettings({ roles: { [r]: { [o.key]: v } } }), !admin));
        row.appendChild(m);
      }
      card.appendChild(row);
      body.appendChild(card);
    }
  }

  // ------------------------------------------------------------------ lobby
  function renderLobby() {
    const r = App.room;
    if (!r) return;
    $('lobby-code').textContent = r.code;
    $('lobby-count').textContent = `${r.players.length}/${r.settings.maxPlayers}`;
    const admin = App.isAdmin();
    $('btn-start').classList.toggle('hidden', !admin);
    $('lobby-wait').classList.toggle('hidden', admin);
    $('btn-lock').classList.toggle('hidden', !admin);
    $('btn-lock').textContent = r.locked ? '🔒 Locked' : '🔓 Open';
    $('lobby-public').textContent = r.settings.isPublic ? 'Public' : 'Private';
    if (!$('modal-players').classList.contains('hidden')) renderPlayers();
    if (!$('modal-settings').classList.contains('hidden') && !pendingSettings) renderSettings();
    if (!$('modal-customize').classList.contains('hidden')) renderCzGrid();
  }

  function renderPlayers() {
    const r = App.room;
    const box = $('players-body');
    box.innerHTML = '';
    const me = App.myId, isHost = r.hostId === me, admin = App.isAdmin();
    for (const p of r.players) {
      const row = el('div', 'player-row');
      row.appendChild(portraitCanvas(p, 48));
      const isH = p.id === r.hostId, isA = r.admins.includes(p.id);
      row.appendChild(el('div', 'pr-name', `${esc(p.name)} ${isH ? '<span class="tag host">👑 Host</span>' : ''}${isA ? '<span class="tag admin">🛡 Admin</span>' : ''}${p.muted ? '<span class="tag muted">🔇</span>' : ''}${p.id === me ? '<span class="tag you">You</span>' : ''}`));
      const acts = el('div', 'pr-actions');
      const act = (label, action, cls) => { const b = el('button', cls || '', label); b.onclick = () => App.socket.emit('admin', { action, target: p.id }); acts.appendChild(b); };
      if (p.id !== me && !isH && admin && (isHost || !isA)) {
        act(p.muted ? 'Unmute' : 'Mute', p.muted ? 'unmute' : 'mute');
        act('Kick', 'kick', 'warn');
        act('Ban', 'ban', 'danger');
      }
      if (p.id !== me && isHost) {
        act(isA ? 'Remove admin' : 'Make admin', isA ? 'demote' : 'promote');
        act('Make host', 'transfer');
      }
      row.appendChild(acts);
      box.appendChild(row);
    }
  }

  function initLobby() {
    $('btn-start').onclick = () => App.socket.emit('start');
    $('btn-wardrobe').onclick = () => openCustomize();
    $('btn-settings').onclick = () => openSettings();
    $('btn-players').onclick = () => { openModal('modal-players'); renderPlayers(); };
    $('btn-lock').onclick = () => App.socket.emit('admin', { action: App.room.locked ? 'unlock' : 'lock' });
    $('btn-leave').onclick = () => { if (confirm('Leave this lobby?')) App.leave(); };
    $('btn-copy').onclick = () => {
      const url = `${location.origin}${location.pathname}?code=${App.room.code}`;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Invite link copied!', 'good'), () => prompt('Copy this invite link:', url));
    };
    $('btn-sound').onclick = () => { const m = Sfx.toggle(); $('btn-sound').textContent = m ? '🔇' : '🔊'; };
    $('btn-sound').textContent = Sfx.muted ? '🔇' : '🔊';
    $('btn-chat').onclick = () => toggleChat();
    $('btn-end').onclick = () => { if (confirm('End the game for everyone and return to the lobby?')) App.socket.emit('admin', { action: 'endGame' }); };
    $('btn-help2').onclick = () => openModal('modal-help');
    const send = (input) => {
      const v = input.value.trim();
      if (v) App.socket.emit('chat', v);
      input.value = '';
    };
    for (const id of ['chat-input', 'meet-chat-input']) {
      $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') { send(e.target); e.stopPropagation(); } });
    }
    $('chat-send').onclick = () => send($('chat-input'));
    $('meet-chat-send').onclick = () => send($('meet-chat-input'));
  }

  // ------------------------------------------------------------------ chat
  let unread = 0;
  function toggleChat(force) {
    const p = $('chat-panel');
    const show = force != null ? force : p.classList.contains('hidden');
    p.classList.toggle('hidden', !show);
    if (show) { unread = 0; $('chat-badge').classList.add('hidden'); }
  }
  function focusChat() {
    if (!$('meeting').classList.contains('hidden')) return $('meet-chat-input').focus();
    if (Game.S.mode === 'lobby' || (Game.S.mode === 'game' && !Game.S.alive)) { toggleChat(true); $('chat-input').focus(); }
  }
  function addChat(m) {
    for (const log of document.querySelectorAll('.chat-log')) {
      const row = el('div', 'chat-msg' + (m.system ? ' system' : '') + (m.ghost ? ' ghost' : '') + (m.from === App.myId ? ' mine' : ''));
      if (m.system) row.textContent = m.text;
      else {
        const prof = (App.room && App.room.players.find((p) => p.id === m.from)) || { color: m.color, name: m.name };
        row.appendChild(portraitCanvas(prof, 34));
        row.appendChild(el('div', 'chat-text', `<b style="color:${Draw.col(m.color).body}">${esc(m.name)}${m.ghost ? ' 👻' : ''}</b><span>${esc(m.text)}</span>`));
      }
      log.appendChild(row);
      while (log.children.length > 120) log.firstChild.remove();
      log.scrollTop = log.scrollHeight;
    }
    if ($('chat-panel').classList.contains('hidden') && !m.system) {
      unread++;
      $('chat-badge').textContent = unread;
      $('chat-badge').classList.remove('hidden');
    }
  }
  function clearChat() { document.querySelectorAll('.chat-log').forEach((l) => (l.innerHTML = '')); }
  function updateChatAvailability() {
    const S = Game.S;
    const can = S.mode === 'lobby' || (S.mode === 'game' && !S.alive);
    $('btn-chat').classList.toggle('hidden', !can);
    if (!can) toggleChat(false);
    $('chat-panel').classList.toggle('ghost-chat', S.mode === 'game');
    $('btn-end').classList.toggle('hidden', !(S.mode === 'game' && App.isAdmin()));
  }

  // ------------------------------------------------------------------ overlays
  function overlay(id, ms) {
    const o = $(id);
    o.classList.remove('hidden');
    if (ms) setTimeout(() => o.classList.add('hidden'), ms);
    return o;
  }

  function roleReveal(d) {
    const R = C.ROLES[d.role];
    const o = $('overlay-role');
    const imp = d.team === 'impostor';
    o.innerHTML = '';
    o.appendChild(el('div', 'rr-sub', imp ? 'Your team' : `There ${d.numImpostors === 1 ? 'is' : 'are'} <b style="color:#ff4757">${d.numImpostors} Impostor${d.numImpostors === 1 ? '' : 's'}</b> on board`));
    const team = el('div', 'rr-team');
    const ids = imp ? d.teammates : [App.myId];
    for (const id of ids) {
      const p = d.players.find((x) => x.id === id);
      if (!p) continue;
      const w = el('div', 'rr-member');
      w.appendChild(portraitCanvas(p, 120, { pet: false }));
      w.appendChild(el('span', '', esc(p.name)));
      team.appendChild(w);
    }
    o.appendChild(team);
    o.appendChild(el('div', 'rr-role', `<span style="color:${R.color}">${R.name}</span>`));
    o.appendChild(el('div', 'rr-desc', R.desc));
    o.style.setProperty('--glow', imp ? '#ff2d2d' : '#3fb8ff');
    overlay('overlay-role', 3600);
    imp ? Sfx.kill() : Sfx.good();
  }

  function killScreen(d) {
    const o = $('overlay-kill');
    o.innerHTML = '';
    if (d.ejected) return;
    const scene = el('div', 'kill-scene');
    scene.appendChild(portraitCanvas(d.killer, 180));
    scene.appendChild(el('div', 'kill-slash', '⚡'));
    scene.appendChild(portraitCanvas(d.victim, 180, { dead: true }));
    o.appendChild(scene);
    o.appendChild(el('div', 'kill-text', 'You were eliminated!' + (d.ghostRole === 'guardian' ? '<small>As a Guardian ghost you can now protect your crew.</small>' : '<small>You can still finish your tasks as a ghost.</small>')));
    overlay('overlay-kill', 2800);
    Sfx.kill();
  }

  // ------------------------------------------------------------------ meetings
  const M = { stage: null, endsAt: 0, players: [], voted: false, timer: null };
  function meetingStart(d) {
    Sfx.meeting();
    const sp = $('overlay-splash');
    sp.innerHTML = '';
    sp.className = 'overlay splash ' + d.type;
    sp.appendChild(el('div', 'splash-title', d.type === 'report' ? 'DEAD BODY REPORTED' : 'EMERGENCY MEETING'));
    const row = el('div', 'splash-row');
    row.appendChild(portraitCanvas(d.caller, 150));
    if (d.body) row.appendChild(portraitCanvas(d.body, 150, { dead: true }));
    sp.appendChild(row);
    sp.appendChild(el('div', 'splash-sub', `${esc(d.caller.name)} called a meeting`));
    overlay('overlay-splash', 2800);
    setTimeout(() => showMeeting(d), 2800);
    M.stage = d.stage;
    M.endsAt = performance.now() + d.endsIn;
    M.players = d.players;
    M.voted = false;
    M.body = d.body;
    M.caller = d.caller;
  }

  function showMeeting(d) {
    closeModals();
    const box = $('meeting');
    box.classList.remove('hidden');
    $('meet-results').classList.add('hidden');
    const grid = $('meet-grid');
    grid.innerHTML = '';
    for (const p of M.players) {
      const card = el('div', 'mcard' + (p.alive ? '' : ' dead') + (p.id === App.myId ? ' me' : ''));
      card.dataset.id = p.id;
      card.appendChild(portraitCanvas(p, 56, { ghost: !p.alive }));
      const info = el('div', 'mc-info', `<b>${esc(p.name)}</b>`);
      if (M.caller && M.caller.id === p.id) info.appendChild(el('span', 'mc-tag', '📢'));
      if (M.body && M.body.id === p.id) info.appendChild(el('span', 'mc-tag', '💀 reported'));
      info.appendChild(el('div', 'mc-votes'));
      card.appendChild(info);
      card.appendChild(el('div', 'mc-voted hidden', 'VOTED'));
      const conf = el('div', 'mc-confirm hidden');
      const yes = el('button', 'yes', '✔'), no = el('button', 'no', '✖');
      yes.onclick = (e) => { e.stopPropagation(); castVote(p.id); };
      no.onclick = (e) => { e.stopPropagation(); conf.classList.add('hidden'); };
      conf.append(yes, no);
      card.appendChild(conf);
      card.onclick = () => {
        if (!canVote() || !p.alive) return;
        document.querySelectorAll('.mc-confirm').forEach((c) => c.classList.add('hidden'));
        conf.classList.remove('hidden');
      };
      grid.appendChild(card);
    }
    $('meet-skip').onclick = () => { if (canVote()) castVote('skip'); };
    $('meet-skipvotes').innerHTML = '';
    clearInterval(M.timer);
    M.timer = setInterval(updateMeetingTimer, 200);
    updateMeetingTimer();
  }
  function canVote() {
    const me = M.players.find((p) => p.id === App.myId);
    return M.stage === 'voting' && me && me.alive && !M.voted;
  }
  function castVote(target) {
    M.voted = true;
    App.socket.emit('vote', target);
    document.querySelectorAll('.mc-confirm').forEach((c) => c.classList.add('hidden'));
    Sfx.vote();
    updateMeetingTimer();
  }
  function updateMeetingTimer() {
    const left = Math.max(0, Math.ceil((M.endsAt - performance.now()) / 1000));
    const label = M.stage === 'discussion' ? `Discussion: ${left}s` : M.stage === 'voting' ? `Voting ends in: ${left}s` : 'Results';
    $('meet-timer').textContent = label;
    $('meet-title').textContent = M.stage === 'discussion' ? 'Discuss! Who seems suspicious?' : M.stage === 'voting' ? (M.voted ? 'Vote cast. Waiting for others…' : canVote() ? 'Vote someone out — or skip.' : 'Ghosts can\'t vote.') : 'Votes are in!';
    $('meet-skip').disabled = !canVote();
    $('meeting').classList.toggle('can-vote', canVote());
  }
  function meetingStage(d) {
    M.stage = d.stage;
    M.endsAt = performance.now() + d.endsIn;
    if (d.stage === 'voting') Sfx.beep();
    updateMeetingTimer();
  }
  function onVoted(d) {
    const card = document.querySelector(`.mcard[data-id="${d.id}"] .mc-voted`);
    if (card) card.classList.remove('hidden');
    Sfx.click();
  }
  function voteResults(d) {
    M.stage = 'results';
    updateMeetingTimer();
    const chip = (voterId) => {
      const p = voterId && M.players.find((x) => x.id === voterId);
      const c = el('i', 'vote-chip');
      c.style.background = p ? Draw.col(p.color).body : '#888';
      c.title = p ? p.name : 'Anonymous';
      return c;
    };
    d.votes.forEach((v, i) => {
      setTimeout(() => {
        const host = v.target === 'skip' ? $('meet-skipvotes') : document.querySelector(`.mcard[data-id="${v.target}"] .mc-votes`);
        if (host) host.appendChild(chip(v.voter));
        Sfx.beep();
      }, 250 * i);
    });
    document.querySelectorAll('.mc-voted').forEach((e) => e.classList.add('hidden'));
    if (d.ejected) setTimeout(() => { const c = document.querySelector(`.mcard[data-id="${d.ejected}"]`); if (c) c.classList.add('ejected'); }, 250 * d.votes.length);
  }
  function eject(d) {
    $('meeting').classList.add('hidden');
    clearInterval(M.timer);
    const o = $('overlay-eject');
    o.innerHTML = '';
    if (d.player) {
      const c = portraitCanvas(d.player, 160);
      c.classList.add('eject-body');
      o.appendChild(c);
    }
    const txt = el('div', 'eject-text');
    o.appendChild(txt);
    const sub = el('div', 'eject-sub');
    o.appendChild(sub);
    overlay('overlay-eject', 6800);
    Sfx.eject();
    let i = 0;
    const type = setInterval(() => {
      i++;
      txt.textContent = d.text.slice(0, i);
      if (i >= d.text.length) { clearInterval(type); setTimeout(() => (sub.textContent = d.sub || ''), 400); }
    }, 55);
  }
  function meetingEnd() {
    $('meeting').classList.add('hidden');
    $('overlay-eject').classList.add('hidden');
    clearInterval(M.timer);
    M.stage = null;
  }

  // ------------------------------------------------------------------ game over
  function gameOver(d) {
    meetingEnd();
    $('overlay-splash').classList.add('hidden');
    const me = d.players.find((p) => p.id === App.myId);
    const won = d.winner && me && me.team === d.winner;
    const o = $('overlay-gameover');
    o.innerHTML = '';
    o.className = 'overlay gameover ' + (d.winner ? (won ? 'win' : 'lose') : '');
    o.appendChild(el('div', 'go-title', d.winner ? (won ? 'VICTORY' : 'DEFEAT') : 'GAME ENDED'));
    o.appendChild(el('div', 'go-reason', `${d.winner === 'crew' ? 'Crewmates win! ' : d.winner === 'impostor' ? 'Impostors win! ' : ''}${esc(d.reason)}`));
    const winners = el('div', 'go-winners');
    for (const p of d.players.filter((x) => !d.winner || x.team === d.winner)) {
      const w = el('div', 'go-member');
      w.appendChild(portraitCanvas(p, 110, { ghost: !p.alive }));
      w.appendChild(el('span', '', esc(p.name)));
      winners.appendChild(w);
    }
    o.appendChild(winners);
    const roles = el('div', 'go-roles');
    for (const p of d.players) {
      const R = C.ROLES[p.role] || C.ROLES.crewmate;
      roles.appendChild(el('div', 'go-role', `<i style="background:${Draw.col(p.color).body}"></i>${esc(p.name)} — <b style="color:${R.color}">${R.name}</b>${p.alive ? '' : ' 💀'}`));
    }
    o.appendChild(roles);
    o.appendChild(el('div', 'go-foot', 'Returning to the lobby…'));
    o.classList.remove('hidden');
    won ? Sfx.win() : Sfx.lose();
  }
  function hideGameOver() { $('overlay-gameover').classList.add('hidden'); }

  // ------------------------------------------------------------------ misc
  function openPicker(title, profiles, onPick) {
    $('picker-title').textContent = title;
    const g = $('picker-grid');
    g.innerHTML = '';
    for (const p of profiles) {
      const b = el('button', 'pick-item');
      b.appendChild(portraitCanvas(p, 72));
      b.appendChild(el('span', '', esc(p.name)));
      b.onclick = () => { closeModal('modal-picker'); onPick(p.id); };
      g.appendChild(b);
    }
    openModal('modal-picker');
  }
  function showClue(d) {
    const b = $('clue-body');
    b.innerHTML = `<p><b>${esc(d.victim.name)}</b> died about <b>${d.seconds}s</b> ago.</p><p>The killer is one of these players:</p>`;
    const row = el('div', 'clue-row');
    d.suspects.forEach((p, i) => {
      const w = el('div', 'rr-member');
      w.appendChild(portraitCanvas(p, 96));
      w.appendChild(el('span', '', esc(p.name)));
      row.appendChild(w);
      if (i === 0 && d.suspects.length > 1) row.appendChild(el('div', 'clue-or', 'or'));
    });
    b.appendChild(row);
    openModal('modal-clue');
  }
  function vitalsList(list) {
    const w = el('div', 'vitals');
    for (const v of list) {
      const row = el('div', 'vital ' + (v.alive ? 'ok' : 'dead'));
      row.appendChild(portraitCanvas(v, 48, { ghost: !v.alive }));
      row.appendChild(el('span', '', esc(v.name)));
      const line = el('div', 'ekg');
      line.innerHTML = v.alive ? '<svg viewBox="0 0 120 30"><polyline points="0,15 30,15 38,4 46,26 54,15 120,15"/></svg>' : '<svg viewBox="0 0 120 30"><polyline points="0,15 120,15"/></svg>';
      row.appendChild(line);
      row.appendChild(el('b', '', v.alive ? 'OK' : 'DEAD'));
      w.appendChild(row);
    }
    return w;
  }

  return {
    toast, initMenu, initLobby, openCustomize, openSettings, renderLobby, renderPlayers, addChat, clearChat, toggleChat,
    focusChat, updateChatAvailability, roleReveal, killScreen, meetingStart, meetingStage, onVoted, voteResults, eject,
    meetingEnd, gameOver, hideGameOver, openPicker, showClue, vitalsList, closeModals, modalOpen, portraitCanvas,
  };
})();
