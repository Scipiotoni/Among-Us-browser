// Accounts and the cookie wallet.
//
// Guests keep cookies in this browser only. An account is stored as a retained MQTT message on
// every public broker (and cached on each device that logs in), encrypted with AES-GCM using a key
// derived from the password (PBKDF2), so it can be read back from any device that knows the password.
// The newest copy wins, and copies that are missing or older get rewritten, so one broker losing
// its data doesn't wipe anyone out.
const Accounts = (() => {
  const TOPIC = () => `${Net.PREFIX}/acct`;
  const SESSION_KEY = 'bi_session';
  const CACHE_KEY = (t) => `bi_acct_${t}`;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

  let current = null; // { user, topic, key (CryptoKey), t }
  let clients = [];
  const listeners = [];
  const changed = () => listeners.forEach((f) => f());

  async function topicFor(user) {
    const h = await crypto.subtle.digest('SHA-256', enc.encode('bi-user:' + user.toLowerCase()));
    return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 40);
  }
  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  async function encrypt(key, salt, user, data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    return { v: 1, user, salt: b64(salt), iv: b64(iv), ct: b64(ct), t: data.t };
  }
  async function decrypt(key, rec) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.ct));
    return JSON.parse(dec.decode(pt));
  }

  // One connection per broker, kept open while logged in so saves reach all of them.
  function ensureClients() {
    if (clients.length) return;
    clients = Net.BROKERS.map((url) => {
      const c = new MqttClient({ url, clientId: `bi-acct-${Math.random().toString(36).slice(2, 10)}`, keepAlive: 45 });
      c.records = new Map();
      c.onMessage = (topic, payload) => {
        const t = topic.split('/').pop();
        let rec = null;
        try { rec = payload ? JSON.parse(payload) : null; } catch (e) { /* junk */ }
        c.records.set(t, rec && rec.ct ? rec : null);
        if (current && t === current.topic && rec && rec.ct && rec.t > current.t) adoptRemote(rec);
      };
      c.connect();
      return c;
    });
  }

  // Waits for each broker's retained copy of an account (retained messages arrive right after subscribing).
  function fetchRecords(topic, ms = 3500) {
    ensureClients();
    for (const c of clients) { c.records.delete(topic); c.subscribe(`${TOPIC()}/${topic}`); }
    return new Promise((resolve) => {
      const t0 = Date.now();
      const check = () => {
        const live = clients.filter((c) => c.connected);
        const answered = live.filter((c) => c.records.has(topic));
        const settled = live.length && answered.length === live.length && Date.now() - t0 > 600;
        if (settled || Date.now() - t0 > ms) {
          resolve({ records: clients.map((c) => c.records.get(topic)).filter(Boolean), reached: live.length });
        } else setTimeout(check, 150);
      };
      setTimeout(check, 300);
    });
  }

  function publishAll(topic, rec) {
    const json = JSON.stringify(rec);
    for (const c of clients) {
      if (c.publish(`${TOPIC()}/${topic}`, json, true)) c.records.set(topic, rec);
    }
    store(CACHE_KEY(topic), rec);
  }

  async function adoptRemote(rec) {
    try {
      const data = await decrypt(current.key, rec);
      current.t = data.t;
      store(CACHE_KEY(current.topic), rec);
      Wallet.setData(data, false);
    } catch (e) { /* not ours, or corrupted: keep what we have */ }
  }

  let saveTimer = null;
  function save(data) {
    if (!current) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      data.t = Date.now();
      current.t = data.t;
      const rec = await encrypt(current.key, unb64(current.salt), current.user, data);
      publishAll(current.topic, rec);
    }, 600);
  }

  function validate(user, pass) {
    if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) return 'Usernames are 3–16 letters, numbers or _.';
    if (String(pass).length < 4) return 'Passwords need at least 4 characters.';
    return null;
  }

  async function startSession(user, topic, key, salt, data) {
    current = { user, topic, key, salt: b64(salt), t: data.t || 0 };
    store(SESSION_KEY, { user, topic, salt: current.salt, key: b64(await crypto.subtle.exportKey('raw', key)) });
    Wallet.setData(data, false);
    changed();
  }

  async function signup(user, pass) {
    user = String(user || '').trim();
    const bad = validate(user, pass);
    if (bad) return { error: bad };
    const topic = await topicFor(user);
    const { records, reached } = await fetchRecords(topic);
    if (!reached) return { error: 'Could not reach the account servers. Check your connection.' };
    if (records.length || load(CACHE_KEY(topic))) return { error: 'That username is taken.' };
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(pass, salt);
    const data = { ...Wallet.guestData(), t: Date.now() }; // guest progress moves into the new account
    await startSession(user, topic, key, salt, data);
    publishAll(topic, await encrypt(key, salt, user, data));
    return { ok: true };
  }

  async function login(user, pass) {
    user = String(user || '').trim();
    const bad = validate(user, pass);
    if (bad) return { error: 'Wrong username or password.' };
    const topic = await topicFor(user);
    const { records, reached } = await fetchRecords(topic);
    const cached = load(CACHE_KEY(topic));
    const all = [...records, cached].filter(Boolean);
    if (!all.length) return { error: reached ? 'No account with that username.' : 'Could not reach the account servers. Check your connection.' };
    let best = null, bestData = null, key = null, salt = null;
    for (const rec of all) {
      try {
        const s = unb64(rec.salt);
        const k = await deriveKey(pass, s);
        const d = await decrypt(k, rec);
        if (!bestData || (d.t || 0) > (bestData.t || 0)) { best = rec; bestData = d; key = k; salt = s; }
      } catch (e) { /* wrong password for this copy */ }
    }
    if (!best) return { error: 'Wrong username or password.' };
    await startSession(best.user || user, topic, key, salt, bestData);
    // Rewrite brokers that are missing the newest copy.
    if (records.length < clients.filter((c) => c.connected).length || records.some((r) => r.t !== best.t)) publishAll(topic, best);
    else store(CACHE_KEY(topic), best);
    return { ok: true };
  }

  function logout() {
    current = null;
    store(SESSION_KEY, null);
    Wallet.useGuest();
    changed();
  }

  // Restores a saved session instantly from the local cache, then checks the brokers for newer saves.
  async function restore() {
    const s = load(SESSION_KEY);
    if (!s || !s.key || !s.topic) return;
    try {
      const key = await crypto.subtle.importKey('raw', unb64(s.key), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      const cached = load(CACHE_KEY(s.topic));
      const data = cached ? await decrypt(key, cached) : Wallet.guestData();
      current = { user: s.user, topic: s.topic, key, salt: s.salt, t: data.t || 0 };
      Wallet.setData(data, false);
      changed();
      const { records } = await fetchRecords(s.topic);
      let newest = cached;
      for (const r of records) if (!newest || r.t > newest.t) newest = r;
      if (newest && newest !== cached) await adoptRemote(newest);
      if (newest && (records.length < clients.filter((c) => c.connected).length || records.some((r) => r.t !== newest.t))) publishAll(s.topic, newest);
    } catch (e) {
      store(SESSION_KEY, null);
    }
  }

  return {
    signup, login, logout, restore, save,
    get user() { return current && current.user; },
    onChange(f) { listeners.push(f); },
  };
})();

// Cookie balance and owned cosmetics, for the guest or the logged-in account.
const Wallet = (() => {
  const GUEST_KEY = 'bi_wallet';
  let data = null;
  const listeners = [];
  const changed = () => listeners.forEach((f) => f());
  const readGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch (e) { return null; } };
  const valid = (d) => d && typeof d.cookies === 'number' && Array.isArray(d.owned);
  function persist() {
    if (Accounts.user) Accounts.save(data);
    else { try { localStorage.setItem(GUEST_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ } }
    changed();
  }
  return {
    // Players keep whatever they were already wearing before the shop existed.
    load(profile) {
      data = readGuest();
      if (!valid(data)) {
        data = { cookies: SHARED.REWARDS.starting, owned: [] };
        for (const cat in SHARED.COSMETIC_DEFAULTS) if (profile[cat]) data.owned.push(`${cat}:${profile[cat]}`);
        persist();
      }
    },
    guestData() { const g = readGuest(); return valid(g) ? { cookies: g.cookies, owned: g.owned.slice() } : { cookies: SHARED.REWARDS.starting, owned: [] }; },
    setData(d, save) {
      data = { cookies: Math.max(0, Math.floor(+d.cookies || 0)), owned: Array.isArray(d.owned) ? d.owned.slice() : [], profile: d.profile, t: d.t };
      if (d.profile && typeof App !== 'undefined') App.applyAccountProfile(d.profile);
      if (save) persist(); else changed();
    },
    useGuest() { data = readGuest(); if (!valid(data)) data = { cookies: SHARED.REWARDS.starting, owned: [] }; changed(); },
    setProfile(profile) { if (Accounts.user && data) { data.profile = profile; persist(); } },
    get cookies() { return data.cookies; },
    price(cat, id) { const it = SHARED.COSMETIC_BY_ID[cat] && SHARED.COSMETIC_BY_ID[cat][id]; return it ? it.price : 0; },
    owns(cat, id) { return cat === 'color' || this.price(cat, id) === 0 || data.owned.includes(`${cat}:${id}`); },
    buy(cat, id) {
      const price = this.price(cat, id);
      if (this.owns(cat, id) || data.cookies < price) return false;
      data.cookies -= price;
      data.owned.push(`${cat}:${id}`);
      persist();
      return true;
    },
    add(n) { if (n > 0) { data.cookies += n; persist(); } },
    onChange(f) { listeners.push(f); },
  };
})();
