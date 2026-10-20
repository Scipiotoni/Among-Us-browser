// Map definitions + geometry helpers, shared by server and browser.
(function (root, factory) {
  const mod = factory(typeof module === 'object' && module.exports ? require('./constants.js') : root.SHARED);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.SHARED = root.SHARED || {}; Object.assign(root.SHARED, mod); }
})(typeof self !== 'undefined' ? self : globalThis, function (C) {
  // ---------------------------------------------------------------- Station Helix
  const SPACE = { bg: 'space', outer: '#10141f', wall: '#2a3247', wallTop: '#56607a', corridor: '#3d4353' };
  const HELIX = {
    id: 'helix',
    name: 'Station Helix',
    theme: SPACE,
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
    theme: SPACE,
    width: 1100,
    height: 700,
    rooms: [
      { id: 'lobby', name: '', x: 100, y: 120, w: 900, h: 460, floor: '#3c4660' },
    ],
    corridors: [
      { x: 470, y: 60, w: 160, h: 100, a: null, b: 'lobby', noDoor: true },
    ],
    stations: {
      laptop: { x: 160, y: 160, label: 'Shop & Wardrobe', console: 'wardrobe' },
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


  // ---------------------------------------------------------------- generated maps
  // Which task / sabotage / console stations go in a room with each role.
  const ROLE_STATIONS = {
    bridge: ['bridge_swipe', 'bridge_chart', 'o2B', 'bridge_steer', 'admin', 'bridge_upload'],
    comms: ['comms_download', 'comms', 'comms_tune'],
    ls: ['ls_filter', 'o2A', 'ls_plants'],
    mess: ['mess_garbage', 'mess_download'],
    medbay: ['medbay_sample', 'medbay_scan'],
    lab: ['lab_sample', 'vitals', 'lab_divert'],
    reactor: ['reactor_manifold', 'reactorA', 'reactor_simon', 'reactorB'],
    engine: ['engine_align', 'engine_fuel'],
    elec: ['elec_wires', 'lights', 'elec_calibrate', 'elec_divert'],
    storage: ['storage_fuel', 'storage_garbage'],
    security: ['security_wires', 'cams'],
    cargo: ['cargo_shields', 'cargo_asteroids'],
  };
  const VENT_GROUPS = [['reactor', 'engine', 'elec'], ['medbay', 'comms', 'mess'], ['bridge', 'ls', 'lab'], ['storage', 'security', 'cargo']];

  // Builds a map from rooms laid out on a grid (c, r = cell; w, h = size in cells; s = shrink 0..1)
  // and the list of room pairs joined by corridors.
  function gridMap(spec) {
    const CELL = spec.cell || 560, GAP = 200, PAD = 100, T = 120, O = 60;
    let cols = 0, rowsN = 0;
    const rooms = spec.rooms.map((r, i) => {
      const s = r.s || 1;
      const bw = (r.w || 1) * CELL - GAP, bh = (r.h || 1) * CELL - GAP;
      const w = Math.round(bw * s), h = Math.round(bh * s);
      cols = Math.max(cols, r.c + (r.w || 1)); rowsN = Math.max(rowsN, r.r + (r.h || 1));
      return {
        id: r.id, name: r.name, role: r.role, w, h,
        x: PAD + r.c * CELL + GAP / 2 + Math.round((bw - w) / 2),
        y: PAD + r.r * CELL + GAP / 2 + Math.round((bh - h) / 2),
        floor: spec.theme.floors[i % spec.theme.floors.length],
      };
    });
    const byId = {}, byRole = {};
    for (const r of rooms) { byId[r.id] = r; byRole[r.role] = r; }
    const corridors = spec.links.map(([ia, ib]) => {
      let a = byId[ia], b = byId[ib];
      const yo = [Math.max(a.y, b.y), Math.min(a.y + a.h, b.y + b.h)];
      const xo = [Math.max(a.x, b.x), Math.min(a.x + a.w, b.x + b.w)];
      if (yo[1] - yo[0] >= T + 40 && (a.x + a.w <= b.x || b.x + b.w <= a.x)) {
        if (b.x < a.x) [a, b] = [b, a];
        const cy = Math.round((yo[0] + yo[1]) / 2);
        return { x: a.x + a.w - O, y: cy - T / 2, w: b.x - (a.x + a.w) + 2 * O, h: T, a: a.id, b: b.id };
      }
      if (xo[1] - xo[0] >= T + 40) {
        if (b.y < a.y) [a, b] = [b, a];
        const cx = Math.round((xo[0] + xo[1]) / 2);
        return { x: cx - T / 2, y: a.y + a.h - O, w: T, h: b.y - (a.y + a.h) + 2 * O, a: a.id, b: b.id };
      }
      throw new Error(`${spec.id}: rooms ${ia} and ${ib} don't line up`);
    });
    const nearCorridor = (x, y, m) => corridors.some((c) => x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m);
    const stations = {}, props = [], vents = [];
    const hub = byId[spec.hub];
    const hubC = { x: hub.x + hub.w / 2, y: hub.y + hub.h / 2 };
    for (const r of rooms) {
      const ids = ROLE_STATIONS[r.role] || [];
      // Spots along the walls, away from corridor openings; tighter spacing for crowded rooms.
      let free = [];
      for (const [step, margin] of [[64, 50], [48, 40], [40, 25], [32, 10]]) {
        const I = 36, slots = [];
        for (let x = r.x + 50; x <= r.x + r.w - 50; x += step) slots.push([x, r.y + I]);
        for (let y = r.y + 100; y <= r.y + r.h - 100; y += step) slots.push([r.x + r.w - I, y]);
        for (let x = r.x + r.w - 50; x >= r.x + 50; x -= step) slots.push([x, r.y + r.h - I]);
        for (let y = r.y + r.h - 100; y >= r.y + 100; y -= step) slots.push([r.x + I, y]);
        free = slots.filter(([x, y]) => !nearCorridor(x, y, margin));
        if (free.length >= ids.length * 2) break;
      }
      if (free.length < ids.length) throw new Error(`${spec.id}: no room for stations in ${r.id}`);
      ids.forEach((id, k) => {
        const [x, y] = free[Math.floor(((k + 0.5) * free.length) / ids.length)];
        stations[id] = { ...HELIX.stations[id], x: Math.round(x), y: Math.round(y) };
      });
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, m = Math.min(r.w, r.h);
      if (r === hub) {
        stations.emergency = { ...HELIX.stations.emergency, x: Math.round(cx), y: Math.round(cy) };
        props.push({ type: 'button', x: cx, y: cy, r: 70 });
        if (m > 330) for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) props.push({ type: 'table', x: cx + dx * r.w * 0.27, y: cy + dy * r.h * 0.27, r: 55 });
      } else if (r.role === 'reactor') props.push({ type: 'reactor', x: cx, y: cy, r: Math.min(85, m / 4.5) });
      else if (r.role === 'medbay') { props.push({ type: 'bed', x: cx + r.w * 0.2, y: cy - 50, w: 70, h: 40 }, { type: 'bed', x: cx + r.w * 0.2, y: cy + 50, w: 70, h: 40 }); }
      else if (r.role === 'storage' || r.role === 'cargo') { props.push({ type: 'crate', x: cx - 50, y: cy, w: 80, h: 80 }, { type: 'crate', x: cx + 45, y: cy - 20, w: 60, h: 60 }, { type: 'crate', x: cx + 20, y: cy + 60, w: 70, h: 55 }); }
      else if (r.role === 'ls') props.push({ type: 'plants', x: cx, y: cy, w: Math.min(220, r.w - 140), h: 40 });
      else if (r.role === 'engine') props.push({ type: 'engine', x: cx, y: cy, w: 160, h: 80 });
      else if (r.role === 'bridge') props.push({ type: 'console', x: cx, y: cy, w: 160, h: 30 });
      else if (r.role === 'lab') props.push({ type: 'labtable', x: cx, y: cy, w: 140, h: 60 });
      else if (r.role === 'security') props.push({ type: 'monitors', x: cx, y: cy, w: 150, h: 25 });
      else if (r.role === 'comms') props.push({ type: 'dish', x: cx, y: cy, r: 40 });
    }
    const group = {};
    VENT_GROUPS.forEach((g, gi) => g.forEach((role) => { group[role] = gi; }));
    for (const r of rooms) {
      if (group[r.role] == null) continue;
      const cands = [[r.x + r.w - 95, r.y + r.h - 95], [r.x + 95, r.y + r.h - 95], [r.x + 95, r.y + 130], [r.x + r.w - 95, r.y + 130], [r.x + r.w / 2 - 110, r.y + r.h - 95]];
      const ok = cands.find(([x, y]) => !nearCorridor(x, y, 40) && Object.values(stations).every((s) => Math.hypot(s.x - x, s.y - y) > 85));
      const [x, y] = ok || cands[0];
      vents.push({ id: 'v_' + r.id, x: Math.round(x), y: Math.round(y), room: r.id, g: group[r.role] });
    }
    for (const v of vents) v.links = vents.filter((o) => o !== v && o.g === v.g).map((o) => o.id);
    const cameras = corridors.slice().sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h)).slice(0, 4)
      .map((c) => ({ name: `${byId[c.a].name} Hall`, x: Math.round(c.x + c.w / 2), y: Math.round(c.y + c.h / 2) }));
    return {
      id: spec.id, name: spec.name, theme: spec.theme,
      width: PAD * 2 + cols * CELL, height: PAD * 2 + rowsN * CELL,
      rooms, corridors, stations, vents, cameras, props,
      spawn: { x: Math.round(hubC.x), y: Math.round(hubC.y), r: Math.min(190, Math.min(hub.w, hub.h) / 2 - 70) },
    };
  }

  const POLAR = gridMap({
    id: 'polar', name: 'Polar Base', hub: 'canteen',
    theme: { bg: 'snow', outer: '#3d4b5f', wall: '#7d8fa8', wallTop: '#c5d4e8', corridor: '#56637a', floors: ['#4c5d77', '#526a80', '#5a6380', '#4a6474'] },
    rooms: [
      { id: 'radio', name: 'Radio Hut', role: 'comms', c: 0, r: 0, s: 0.85 },
      { id: 'command', name: 'Command', role: 'bridge', c: 1, r: 0, w: 2 },
      { id: 'greenhouse', name: 'Greenhouse', role: 'ls', c: 3, r: 0 },
      { id: 'infirmary', name: 'Infirmary', role: 'medbay', c: 0, r: 1 },
      { id: 'canteen', name: 'Canteen', role: 'mess', c: 1, r: 1, w: 2 },
      { id: 'icelab', name: 'Ice Lab', role: 'lab', c: 3, r: 1 },
      { id: 'generator', name: 'Generator', role: 'reactor', c: 0, r: 2, h: 2 },
      { id: 'power', name: 'Power Room', role: 'elec', c: 1, r: 2, s: 0.85 },
      { id: 'depot', name: 'Supply Depot', role: 'storage', c: 2, r: 2 },
      { id: 'tower', name: 'Watchtower', role: 'security', c: 3, r: 2, s: 0.85 },
      { id: 'garage', name: 'Snowcat Garage', role: 'engine', c: 1, r: 3 },
      { id: 'dock', name: 'Loading Dock', role: 'cargo', c: 2, r: 3, w: 2 },
    ],
    links: [['radio', 'command'], ['command', 'greenhouse'], ['radio', 'infirmary'], ['command', 'canteen'], ['greenhouse', 'icelab'], ['infirmary', 'canteen'], ['canteen', 'icelab'], ['infirmary', 'generator'], ['canteen', 'depot'], ['generator', 'power'], ['power', 'depot'], ['depot', 'tower'], ['icelab', 'tower'], ['power', 'garage'], ['generator', 'garage'], ['garage', 'dock'], ['tower', 'dock']],
  });

  const SKYLAB = gridMap({
    id: 'skylab', name: 'Skyport', hub: 'lounge',
    theme: { bg: 'sky', outer: '#8193ab', wall: '#d7e0ea', wallTop: '#f4f8fc', corridor: '#7c8ea6', floors: ['#5d7391', '#64708f', '#587a8c', '#6a6f93'] },
    rooms: [
      { id: 'cockpit', name: 'Cockpit', role: 'bridge', c: 1, r: 0 },
      { id: 'antenna', name: 'Antenna Deck', role: 'comms', c: 0, r: 1, s: 0.85 },
      { id: 'lounge', name: 'Sky Lounge', role: 'mess', c: 1, r: 1 },
      { id: 'garden', name: 'Air Garden', role: 'ls', c: 2, r: 1, s: 0.85 },
      { id: 'clinic', name: 'Clinic', role: 'medbay', c: 0, r: 2, s: 0.85 },
      { id: 'weather', name: 'Weather Lab', role: 'lab', c: 2, r: 2, s: 0.85 },
      { id: 'turbine', name: 'Turbine Core', role: 'reactor', c: 0, r: 3 },
      { id: 'battery', name: 'Battery Bay', role: 'elec', c: 1, r: 3 },
      { id: 'hangar', name: 'Hangar', role: 'storage', c: 2, r: 3 },
      { id: 'props', name: 'Propellers', role: 'engine', c: 0, r: 4, s: 0.85 },
      { id: 'lookout', name: 'Lookout', role: 'security', c: 1, r: 4, s: 0.85 },
      { id: 'lift', name: 'Cargo Lift', role: 'cargo', c: 2, r: 4 },
    ],
    links: [['cockpit', 'lounge'], ['antenna', 'lounge'], ['lounge', 'garden'], ['antenna', 'clinic'], ['garden', 'weather'], ['clinic', 'turbine'], ['weather', 'hangar'], ['turbine', 'battery'], ['battery', 'hangar'], ['turbine', 'props'], ['battery', 'lookout'], ['hangar', 'lift'], ['props', 'lookout'], ['lookout', 'lift'], ['lounge', 'battery']],
  });

  const DEEPSEA = gridMap({
    id: 'deepsea', name: 'Abyss Station', hub: 'galley',
    theme: { bg: 'ocean', outer: '#04161f', wall: '#1d4a5a', wallTop: '#3f8091', corridor: '#29505c', floors: ['#2c4a5c', '#2f5560', '#33485e', '#2a5257'] },
    rooms: [
      { id: 'sonar', name: 'Sonar', role: 'comms', c: 0, r: 0, s: 0.85 },
      { id: 'sickbay', name: 'Sick Bay', role: 'medbay', c: 1, r: 0, s: 0.85 },
      { id: 'control', name: 'Control Room', role: 'bridge', c: 2, r: 0 },
      { id: 'aquarium', name: 'Aquarium Lab', role: 'lab', c: 3, r: 0, s: 0.85 },
      { id: 'kelp', name: 'Kelp Farm', role: 'ls', c: 4, r: 0 },
      { id: 'core', name: 'Pressure Core', role: 'reactor', c: 0, r: 1 },
      { id: 'galley', name: 'Galley', role: 'mess', c: 1, r: 1, w: 3 },
      { id: 'security', name: 'Security', role: 'security', c: 4, r: 1, s: 0.85 },
      { id: 'pumps', name: 'Pump Room', role: 'engine', c: 0, r: 2 },
      { id: 'electrical', name: 'Electrical', role: 'elec', c: 1, r: 2, s: 0.85 },
      { id: 'storage', name: 'Storage', role: 'storage', c: 2, r: 2, w: 2 },
      { id: 'subdock', name: 'Sub Dock', role: 'cargo', c: 4, r: 2 },
    ],
    links: [['sonar', 'sickbay'], ['sickbay', 'control'], ['control', 'aquarium'], ['aquarium', 'kelp'], ['sonar', 'core'], ['core', 'galley'], ['galley', 'security'], ['kelp', 'security'], ['control', 'galley'], ['core', 'pumps'], ['pumps', 'electrical'], ['electrical', 'storage'], ['storage', 'subdock'], ['security', 'subdock'], ['galley', 'storage']],
  });

  const DESERT = gridMap({
    id: 'desert', name: 'Dune Outpost', hub: 'cantina',
    theme: { bg: 'sand', outer: '#5c4126', wall: '#a07850', wallTop: '#d8b98a', corridor: '#7a6046', floors: ['#6b5641', '#735b3f', '#665747', '#6e5a46'] },
    rooms: [
      { id: 'water', name: 'Water Plant', role: 'ls', c: 0, r: 0, s: 0.85 },
      { id: 'hq', name: 'HQ', role: 'bridge', c: 1, r: 0 },
      { id: 'signal', name: 'Signal Tower', role: 'comms', c: 2, r: 0, s: 0.85 },
      { id: 'fossil', name: 'Fossil Lab', role: 'lab', c: 3, r: 0 },
      { id: 'firstaid', name: 'First Aid', role: 'medbay', c: 0, r: 1 },
      { id: 'cantina', name: 'Cantina', role: 'mess', c: 1, r: 1, w: 2 },
      { id: 'guard', name: 'Guard Post', role: 'security', c: 3, r: 1, s: 0.85 },
      { id: 'solar', name: 'Solar Core', role: 'reactor', c: 0, r: 2 },
      { id: 'motor', name: 'Motor Pool', role: 'engine', c: 1, r: 2 },
      { id: 'fuse', name: 'Fuse Room', role: 'elec', c: 2, r: 2 },
      { id: 'warehouse', name: 'Warehouse', role: 'storage', c: 3, r: 2 },
      { id: 'caravan', name: 'Caravan Bay', role: 'cargo', c: 1, r: 3, w: 2 },
    ],
    links: [['water', 'hq'], ['hq', 'signal'], ['signal', 'fossil'], ['water', 'firstaid'], ['fossil', 'guard'], ['firstaid', 'cantina'], ['cantina', 'guard'], ['firstaid', 'solar'], ['guard', 'warehouse'], ['solar', 'motor'], ['motor', 'fuse'], ['fuse', 'warehouse'], ['hq', 'cantina'], ['cantina', 'motor'], ['motor', 'caravan'], ['fuse', 'caravan']],
  });

  const MINE = gridMap({
    id: 'mine', name: 'Asteroid Mine', hub: 'breakroom',
    theme: { bg: 'asteroids', outer: '#140f0c', wall: '#4a3b31', wallTop: '#7d6656', corridor: '#43392f', floors: ['#4d4540', '#524640', '#4a4847', '#55493d'] },
    rooms: [
      { id: 'drill', name: 'Drill Core', role: 'reactor', c: 0, r: 0 },
      { id: 'relay', name: 'Relay', role: 'comms', c: 1, r: 0 },
      { id: 'ops', name: 'Ops Center', role: 'bridge', c: 2, r: 0, w: 2, s: 0.9 },
      { id: 'thrusters', name: 'Thrusters', role: 'engine', c: 0, r: 1, s: 0.85 },
      { id: 'breakroom', name: 'Break Room', role: 'mess', c: 1, r: 1, w: 2, h: 2, s: 0.8 },
      { id: 'assay', name: 'Assay Lab', role: 'lab', c: 3, r: 1, s: 0.85 },
      { id: 'grid', name: 'Power Grid', role: 'elec', c: 0, r: 2, s: 0.85 },
      { id: 'scrubbers', name: 'Air Scrubbers', role: 'ls', c: 3, r: 2, s: 0.85 },
      { id: 'ore', name: 'Ore Storage', role: 'storage', c: 0, r: 3 },
      { id: 'security', name: 'Security', role: 'security', c: 1, r: 3, s: 0.85 },
      { id: 'medical', name: 'Medical', role: 'medbay', c: 2, r: 3, s: 0.85 },
      { id: 'loader', name: 'Ore Loader', role: 'cargo', c: 3, r: 3 },
    ],
    links: [['drill', 'relay'], ['relay', 'ops'], ['drill', 'thrusters'], ['relay', 'breakroom'], ['ops', 'assay'], ['thrusters', 'breakroom'], ['breakroom', 'assay'], ['thrusters', 'grid'], ['assay', 'scrubbers'], ['grid', 'breakroom'], ['breakroom', 'scrubbers'], ['grid', 'ore'], ['ore', 'security'], ['security', 'medical'], ['medical', 'loader'], ['scrubbers', 'loader'], ['breakroom', 'security'], ['breakroom', 'medical']],
  });

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
    MAPS: {
      helix: buildMap(HELIX), polar: buildMap(POLAR), skylab: buildMap(SKYLAB),
      deepsea: buildMap(DEEPSEA), desert: buildMap(DESERT), mine: buildMap(MINE), lobby: buildMap(LOBBY),
    },
    TASKS,
  };
});
