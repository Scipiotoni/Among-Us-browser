// Map definitions + geometry helpers, shared by server and browser.
(function (root, factory) {
  const mod = factory(typeof module === 'object' && module.exports ? require('./constants.js') : root.SHARED);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.SHARED = root.SHARED || {}; Object.assign(root.SHARED, mod); }
})(typeof self !== 'undefined' ? self : globalThis, function (C) {
  // ---------------------------------------------------------------- Station Helix
  const HELIX = {
    id: 'helix',
    name: 'Station Helix',
    width: 3200,
    height: 2050,
    rooms: [
      { id: 'bridge', name: 'Bridge', x: 1400, y: 100, w: 500, h: 350, floor: '#33415f' },
      { id: 'comms', name: 'Communications', x: 700, y: 150, w: 400, h: 300, floor: '#3d3a5c' },
      { id: 'lifesupport', name: 'Life Support', x: 2200, y: 150, w: 450, h: 350, floor: '#2f5249' },
      { id: 'mess', name: 'Mess Hall', x: 1300, y: 700, w: 700, h: 550, floor: '#4a4f63' },
      { id: 'medbay', name: 'Medbay', x: 750, y: 750, w: 400, h: 350, floor: '#3b5560' },
      { id: 'lab', name: 'Laboratory', x: 2350, y: 750, w: 450, h: 450, floor: '#3e4d66' },
      { id: 'reactor', name: 'Reactor', x: 100, y: 600, w: 400, h: 600, floor: '#4d3a46' },
      { id: 'engine', name: 'Engine Room', x: 200, y: 1450, w: 500, h: 450, floor: '#4b4636' },
      { id: 'electrical', name: 'Electrical', x: 900, y: 1400, w: 400, h: 350, floor: '#4a4a35' },
      { id: 'storage', name: 'Storage', x: 1450, y: 1450, w: 550, h: 500, floor: '#45403a' },
      { id: 'security', name: 'Security', x: 2150, y: 1500, w: 400, h: 350, floor: '#3a3f55' },
      { id: 'cargo', name: 'Cargo Bay', x: 2650, y: 1450, w: 450, h: 450, floor: '#3c4a44' },
    ],
    // a = top/left room, b = bottom/right room (used to place doors)
    corridors: [
      { x: 1590, y: 390, w: 120, h: 370, a: 'bridge', b: 'mess' },
      { x: 1040, y: 230, w: 420, h: 120, a: 'comms', b: 'bridge' },
      { x: 1840, y: 250, w: 420, h: 120, a: 'bridge', b: 'lifesupport' },
      { x: 1940, y: 900, w: 470, h: 120, a: 'mess', b: 'lab' },
      { x: 2450, y: 440, w: 120, h: 370, a: 'lifesupport', b: 'lab' },
      { x: 1090, y: 880, w: 270, h: 120, a: 'medbay', b: 'mess' },
      { x: 850, y: 390, w: 120, h: 420, a: 'comms', b: 'medbay' },
      { x: 440, y: 850, w: 370, h: 120, a: 'reactor', b: 'medbay' },
      { x: 300, y: 1140, w: 120, h: 370, a: 'reactor', b: 'engine' },
      { x: 640, y: 1550, w: 320, h: 120, a: 'engine', b: 'electrical' },
      { x: 1590, y: 1190, w: 120, h: 320, a: 'mess', b: 'storage' },
      { x: 1240, y: 1550, w: 270, h: 120, a: 'electrical', b: 'storage' },
      { x: 1940, y: 1620, w: 270, h: 120, a: 'storage', b: 'security' },
      { x: 2490, y: 1600, w: 220, h: 120, a: 'security', b: 'cargo' },
      { x: 2680, y: 1140, w: 120, h: 370, a: 'lab', b: 'cargo' },
    ],
    stations: {
      bridge_swipe: { x: 1870, y: 420, label: 'Card Reader' },
      bridge_chart: { x: 1440, y: 135, label: 'Navigation' },
      bridge_steer: { x: 1560, y: 135, label: 'Steering' },
      bridge_upload: { x: 1860, y: 135, label: 'Uplink' },
      comms_download: { x: 740, y: 185, label: 'Data Terminal' },
      comms_tune: { x: 740, y: 415, label: 'Antenna Panel' },
      ls_filter: { x: 2240, y: 465, label: 'O2 Filter' },
      ls_plants: { x: 2615, y: 185, label: 'Hydroponics' },
      mess_garbage: { x: 1335, y: 735, label: 'Garbage Chute' },
      mess_download: { x: 1965, y: 735, label: 'Data Terminal' },
      medbay_scan: { x: 950, y: 1010, label: 'Body Scanner' },
      medbay_sample: { x: 785, y: 785, label: 'Sample Analyzer' },
      lab_sample: { x: 2385, y: 1165, label: 'Microscope' },
      lab_divert: { x: 2385, y: 785, label: 'Power Relay' },
      reactor_manifold: { x: 135, y: 640, label: 'Manifolds' },
      reactor_simon: { x: 135, y: 1165, label: 'Reactor Core' },
      engine_align: { x: 235, y: 1485, label: 'Engine Output' },
      engine_fuel: { x: 665, y: 1865, label: 'Fuel Intake' },
      elec_wires: { x: 935, y: 1435, label: 'Wiring' },
      elec_calibrate: { x: 1265, y: 1435, label: 'Distributor' },
      elec_divert: { x: 1100, y: 1435, label: 'Breaker Box' },
      storage_fuel: { x: 1485, y: 1485, label: 'Fuel Tanks' },
      storage_garbage: { x: 1965, y: 1915, label: 'Trash Compactor' },
      security_wires: { x: 2185, y: 1535, label: 'Wiring' },
      cargo_shields: { x: 3065, y: 1485, label: 'Shield Panel' },
      cargo_asteroids: { x: 3065, y: 1865, label: 'Turret Control' },
      // sabotage panels
      reactorA: { x: 465, y: 640, label: 'Reactor Pad A', sab: 'reactor' },
      reactorB: { x: 465, y: 1165, label: 'Reactor Pad B', sab: 'reactor' },
      o2A: { x: 2615, y: 465, label: 'O2 Keypad', sab: 'o2' },
      o2B: { x: 1435, y: 415, label: 'O2 Keypad', sab: 'o2' },
      lights: { x: 935, y: 1715, label: 'Light Switches', sab: 'lights' },
      comms: { x: 1065, y: 415, label: 'Comms Dial', sab: 'comms' },
      // consoles
      emergency: { x: 1650, y: 975, label: 'Emergency Button', console: 'emergency' },
      cams: { x: 2350, y: 1535, label: 'Security Cameras', console: 'cams' },
      admin: { x: 1650, y: 270, label: 'Admin Map', console: 'admin' },
      vitals: { x: 2765, y: 785, label: 'Vitals', console: 'vitals' },
    },
    vents: [
      { id: 'v_reactor', x: 300, y: 760, room: 'reactor', links: ['v_engine', 'v_elec'] },
      { id: 'v_engine', x: 450, y: 1720, room: 'engine', links: ['v_reactor', 'v_elec'] },
      { id: 'v_elec', x: 1100, y: 1660, room: 'electrical', links: ['v_reactor', 'v_engine'] },
      { id: 'v_medbay', x: 800, y: 1050, room: 'medbay', links: ['v_comms', 'v_mess'] },
      { id: 'v_comms', x: 900, y: 300, room: 'comms', links: ['v_medbay', 'v_mess'] },
      { id: 'v_mess', x: 1360, y: 1190, room: 'mess', links: ['v_medbay', 'v_comms'] },
      { id: 'v_bridge', x: 1500, y: 390, room: 'bridge', links: ['v_ls', 'v_lab'] },
      { id: 'v_ls', x: 2400, y: 300, room: 'lifesupport', links: ['v_bridge', 'v_lab'] },
      { id: 'v_lab', x: 2550, y: 1100, room: 'lab', links: ['v_bridge', 'v_ls'] },
      { id: 'v_storage', x: 1750, y: 1820, room: 'storage', links: ['v_security', 'v_cargo'] },
      { id: 'v_security', x: 2450, y: 1790, room: 'security', links: ['v_storage', 'v_cargo'] },
      { id: 'v_cargo', x: 2900, y: 1700, room: 'cargo', links: ['v_storage', 'v_security'] },
    ],
    cameras: [
      { name: 'North Hall', x: 1650, y: 560 },
      { name: 'West Hall', x: 620, y: 910 },
      { name: 'South Hall', x: 1650, y: 1360 },
      { name: 'East Hall', x: 2170, y: 960 },
    ],
    // decorative props: {type, x, y, w?, h?, r?}
    props: [
      { type: 'table', x: 1480, y: 830, r: 60 }, { type: 'table', x: 1820, y: 830, r: 60 },
      { type: 'table', x: 1480, y: 1120, r: 60 }, { type: 'table', x: 1820, y: 1120, r: 60 },
      { type: 'button', x: 1650, y: 975, r: 70 },
      { type: 'reactor', x: 300, y: 900, r: 85 },
      { type: 'bed', x: 1060, y: 790, w: 70, h: 40 }, { type: 'bed', x: 1060, y: 1050, w: 70, h: 40 },
      { type: 'crate', x: 1560, y: 1600, w: 80, h: 80 }, { type: 'crate', x: 1650, y: 1600, w: 60, h: 60 },
      { type: 'crate', x: 1860, y: 1720, w: 90, h: 70 }, { type: 'crate', x: 2800, y: 1560, w: 80, h: 80 },
      { type: 'crate', x: 2950, y: 1600, w: 70, h: 90 },
      { type: 'engine', x: 450, y: 1560, w: 160, h: 80 },
      { type: 'plants', x: 2300, y: 220, w: 220, h: 40 },
      { type: 'console', x: 1650, y: 130, w: 160, h: 30 },
      { type: 'admintable', x: 1650, y: 270, w: 140, h: 70 },
      { type: 'monitors', x: 2350, y: 1520, w: 150, h: 25 },
      { type: 'labtable', x: 2575, y: 975, w: 140, h: 60 },
      { type: 'dish', x: 900, y: 220, r: 40 },
    ],
    spawn: { x: 1650, y: 975, r: 190 },
  };

  // ---------------------------------------------------------------- Lobby (dropship)
  const LOBBY = {
    id: 'lobby',
    name: 'Dropship',
    width: 1100,
    height: 700,
    rooms: [
      { id: 'lobby', name: '', x: 100, y: 120, w: 900, h: 460, floor: '#3c4660' },
    ],
    corridors: [
      { x: 470, y: 60, w: 160, h: 100, a: null, b: 'lobby', noDoor: true },
    ],
    stations: {
      laptop: { x: 160, y: 160, label: 'Wardrobe', console: 'wardrobe' },
      laptop2: { x: 940, y: 160, label: 'Game Settings', console: 'settings' },
    },
    vents: [],
    cameras: [],
    props: [
      { type: 'crate', x: 200, y: 500, w: 70, h: 70 }, { type: 'crate', x: 280, y: 520, w: 50, h: 50 },
      { type: 'crate', x: 880, y: 500, w: 80, h: 60 },
      { type: 'window', x: 550, y: 80, w: 140, h: 40 },
    ],
    spawn: { x: 550, y: 360, r: 150 },
  };

  // ---------------------------------------------------------------- helpers
  function buildMap(def) {
    const roomById = {};
    for (const r of def.rooms) roomById[r.id] = r;
    // Doors sit where a corridor leaves a room.
    const doors = [];
    const T = 14;
    def.corridors.forEach((c, i) => {
      if (c.noDoor) return;
      const horiz = c.w > c.h;
      const A = roomById[c.a], B = roomById[c.b];
      if (A) doors.push(horiz
        ? { id: 'd' + i + 'a', room: A.id, x: A.x + A.w, y: c.y, w: T, h: c.h }
        : { id: 'd' + i + 'a', room: A.id, x: c.x, y: A.y + A.h, w: c.w, h: T });
      if (B) doors.push(horiz
        ? { id: 'd' + i + 'b', room: B.id, x: B.x - T, y: c.y, w: T, h: c.h }
        : { id: 'd' + i + 'b', room: B.id, x: c.x, y: B.y - T, w: c.w, h: T });
    });
    const rects = [...def.rooms, ...def.corridors];
    const ventById = {};
    for (const v of def.vents) ventById[v.id] = v;

    function inRect(r, x, y, pad) {
      return x >= r.x + pad && x <= r.x + r.w - pad && y >= r.y + pad && y <= r.y + r.h - pad;
    }
    function doorBlocks(x, y, closedRooms, pad) {
      if (!closedRooms) return false;
      for (const d of doors) {
        if (closedRooms[d.room] && x >= d.x - pad && x <= d.x + d.w + pad && y >= d.y - pad && y <= d.y + d.h + pad) return true;
      }
      return false;
    }
    // Can a player's centre stand at (x,y)?
    function isWalkable(x, y, closedRooms) {
      const pad = C.PLAYER_RADIUS;
      let ok = false;
      for (const r of rects) if (inRect(r, x, y, pad)) { ok = true; break; }
      return ok && !doorBlocks(x, y, closedRooms, pad);
    }
    // Is (x,y) open space (for line of sight)?
    function isOpen(x, y, closedRooms) {
      let ok = false;
      for (const r of rects) if (inRect(r, x, y, 0)) { ok = true; break; }
      return ok && !doorBlocks(x, y, closedRooms, 0);
    }
    function lineOfSight(x1, y1, x2, y2, closedRooms) {
      const d = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.ceil(d / 14);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (!isOpen(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, closedRooms)) return false;
      }
      return true;
    }
    function roomAt(x, y) {
      for (const r of def.rooms) if (inRect(r, x, y, 0)) return r;
      return null;
    }
    function spawnPoint(i, n) {
      const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      return { x: Math.round(def.spawn.x + Math.cos(a) * def.spawn.r), y: Math.round(def.spawn.y + Math.sin(a) * def.spawn.r * 0.8) };
    }
    return Object.assign({}, def, { roomById, doors, rects, ventById, isWalkable, isOpen, lineOfSight, roomAt, spawnPoint });
  }

  // ---------------------------------------------------------------- tasks
  // kind: common | long | short. Each step is done at a station with a minigame.
  const TASKS = {
    swipe: { name: 'Swipe ID Card', kind: 'common', steps: [{ station: 'bridge_swipe', game: 'swipe' }] },
    wires: { name: 'Fix Wiring', kind: 'common', steps: [{ station: 'elec_wires', game: 'wires' }, { station: 'security_wires', game: 'wires' }] },
    upload: { name: 'Upload Data', kind: 'long', steps: [{ station: 'comms_download', game: 'download' }, { station: 'bridge_upload', game: 'upload' }] },
    fuel: { name: 'Refuel Engine', kind: 'long', steps: [{ station: 'storage_fuel', game: 'fuel' }, { station: 'engine_fuel', game: 'fuel' }] },
    reactor: { name: 'Restart Reactor Core', kind: 'long', steps: [{ station: 'reactor_simon', game: 'simon' }] },
    sample: { name: 'Inspect Sample', kind: 'long', steps: [{ station: 'lab_sample', game: 'sample' }] },
    asteroids: { name: 'Clear Asteroids', kind: 'long', steps: [{ station: 'cargo_asteroids', game: 'asteroids' }] },
    power: { name: 'Divert Power', kind: 'long', steps: [{ station: 'elec_divert', game: 'divert' }, { station: 'lab_divert', game: 'accept' }] },
    manifolds: { name: 'Unlock Manifolds', kind: 'short', steps: [{ station: 'reactor_manifold', game: 'numbers' }] },
    calibrate: { name: 'Calibrate Distributor', kind: 'short', steps: [{ station: 'elec_calibrate', game: 'calibrate' }] },
    shields: { name: 'Prime Shields', kind: 'short', steps: [{ station: 'cargo_shields', game: 'shields' }] },
    filter: { name: 'Clean O2 Filter', kind: 'short', steps: [{ station: 'ls_filter', game: 'filter' }] },
    plants: { name: 'Water Plants', kind: 'short', steps: [{ station: 'ls_plants', game: 'water' }] },
    garbage: { name: 'Empty Garbage', kind: 'short', steps: [{ station: 'mess_garbage', game: 'garbage' }, { station: 'storage_garbage', game: 'garbage' }] },
    align: { name: 'Align Engine Output', kind: 'short', steps: [{ station: 'engine_align', game: 'align' }] },
    chart: { name: 'Chart Course', kind: 'short', steps: [{ station: 'bridge_chart', game: 'chart' }] },
    steer: { name: 'Stabilize Steering', kind: 'short', steps: [{ station: 'bridge_steer', game: 'steer' }] },
    scan: { name: 'Submit Scan', kind: 'short', visual: true, steps: [{ station: 'medbay_scan', game: 'scan' }] },
    analyze: { name: 'Analyze Blood', kind: 'short', steps: [{ station: 'medbay_sample', game: 'analyze' }] },
    tune: { name: 'Tune Antenna', kind: 'short', steps: [{ station: 'comms_tune', game: 'tune' }] },
    download2: { name: 'Download Menu', kind: 'short', steps: [{ station: 'mess_download', game: 'download' }] },
  };

  return {
    MAPS: { helix: buildMap(HELIX), lobby: buildMap(LOBBY) },
    TASKS,
  };
});
