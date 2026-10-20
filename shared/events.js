// Seasonal events: each runs for two weeks a year and unlocks a themed map, an event shop and an
// event box. Dates are month/day (1-based) in the player's local time; `?event=<id>` in the page URL
// previews an event outside its dates.
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.SHARED = root.SHARED || {}; Object.assign(root.SHARED, mod); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const EVENTS = [
    { id: 'halloween', name: 'Halloween', icon: '🎃', color: '#ff7b1c', start: [10, 18], end: [10, 31], map: 'manor' },
    { id: 'christmas', name: 'Christmas', icon: '🎄', color: '#2ecc71', start: [12, 12], end: [12, 25], map: 'workshop' },
    { id: 'summer', name: 'Summer Kickoff', icon: '🏖️', color: '#ffbe2e', start: [6, 21], end: [7, 4], map: 'beach' },
  ];
  const DAY = 86400000;

  // Start and end (end = midnight after the last day) of an event's run around `date`.
  function window(ev, date) {
    const y = date.getFullYear();
    for (const yy of [y - 1, y, y + 1]) {
      const s = new Date(yy, ev.start[0] - 1, ev.start[1]);
      const endYear = ev.end[0] < ev.start[0] ? yy + 1 : yy;
      const e = new Date(endYear, ev.end[0] - 1, ev.end[1] + 1);
      if (date < e) return { start: s, end: e };
    }
    return null;
  }

  function overrideId() {
    try { return typeof location !== 'undefined' ? new URLSearchParams(location.search).get('event') : null; } catch (e) { return null; }
  }

  function activeEvent(date = new Date()) {
    const forced = EVENTS.find((e) => e.id === overrideId());
    if (forced) return forced;
    return EVENTS.find((ev) => { const w = window(ev, date); return w && date >= w.start && date < w.end; }) || null;
  }

  function eventEnds(ev, date = new Date()) {
    const w = window(ev, date);
    return w ? w.end : null;
  }

  function nextEvent(date = new Date()) {
    let best = null, bestStart = null;
    for (const ev of EVENTS) {
      const w = window(ev, date);
      if (w && w.start > date && (!bestStart || w.start < bestStart)) { best = ev; bestStart = w.start; }
    }
    return best ? { event: best, days: Math.ceil((bestStart - date) / DAY) } : null;
  }

  const isEventActive = (id, date) => { const ev = activeEvent(date); return !!ev && ev.id === id; };

  return { EVENTS, activeEvent, eventEnds, nextEvent, isEventActive };
});
