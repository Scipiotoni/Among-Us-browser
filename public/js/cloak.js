// Hide tab: makes the browser tab look like a school site (its title and icon); the game keeps
// running underneath. Same approach as Casino-simulator's tab cloak. The icons are simple generic
// drawings made here, not the sites' real logos.
const Cloak = (() => {
  const KEY = 'bi_cloak';
  const svg = (body, vb = '0 0 48 48') => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${body}</svg>`);
  const page = (fill, fold, inner) => svg(`<path d='M6 2h24l12 12v30a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z' fill='${fill}'/><path d='M30 2l12 12H33a3 3 0 0 1-3-3z' fill='${fold}'/>${inner}`);
  const lines = "<rect x='11' y='22' width='22' height='3' fill='#fff'/><rect x='11' y='29' width='22' height='3' fill='#fff'/><rect x='11' y='36' width='14' height='3' fill='#fff'/>";

  const OPTIONS = [
    { id: 'off', name: 'Off (show game)', title: null },
    { id: 'docs', name: 'Google Docs', title: 'Untitled document - Google Docs', icon: page('#4285f4', '#a1c2fa', lines) },
    { id: 'slides', name: 'Google Slides', title: 'Untitled presentation - Google Slides', icon: page('#f4b400', '#fbe39f', "<rect x='11' y='22' width='22' height='15' rx='1.5' fill='none' stroke='#fff' stroke-width='3'/>") },
    { id: 'sheets', name: 'Google Sheets', title: 'Untitled spreadsheet - Google Sheets', icon: page('#0f9d58', '#87ceac', "<rect x='11' y='21' width='22' height='18' fill='none' stroke='#fff' stroke-width='2.5'/><path d='M11 30h22M22 21v18' stroke='#fff' stroke-width='2.5'/>") },
    { id: 'drive', name: 'Google Drive', title: 'My Drive - Google Drive', icon: svg("<path d='M4 14a4 4 0 0 1 4-4h12l4 5h16a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z' fill='#5f6368'/><path d='M4 20h40v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z' fill='#80868b'/>") },
    { id: 'classroom', name: 'Google Classroom', title: 'Classes', icon: svg("<rect x='3' y='7' width='42' height='34' rx='4' fill='#1e8e3e'/><rect x='8' y='12' width='32' height='22' rx='2' fill='#34a853'/><circle cx='24' cy='20' r='4' fill='#fff'/><path d='M16 31a8 6 0 0 1 16 0z' fill='#fff'/><rect x='28' y='36' width='12' height='3' fill='#fff'/>") },
    { id: 'canva', name: 'Canva', title: 'Untitled design - Canva', icon: svg("<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#00c4cc'/><stop offset='1' stop-color='#7d2ae8'/></linearGradient></defs><circle cx='24' cy='24' r='21' fill='url(#g)'/><path d='M15 30c4-12 14-16 18-12' stroke='#fff' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='15' cy='31' r='3' fill='#fff'/>") },
    { id: 'khan', name: 'Khan Academy', title: 'Dashboard | Khan Academy', icon: svg("<path d='M24 3l18 10.5v21L24 45 6 34.5v-21z' fill='#14bf96'/><circle cx='24' cy='20' r='5' fill='#fff'/><path d='M14 32c3-6 17-6 20 0' stroke='#fff' stroke-width='3.5' fill='none' stroke-linecap='round'/>") },
    { id: 'quizlet', name: 'Quizlet', title: 'Your library | Quizlet', icon: svg("<rect x='3' y='3' width='42' height='42' rx='9' fill='#4255ff'/><circle cx='23' cy='23' r='10' fill='none' stroke='#fff' stroke-width='4.5'/><path d='M28 28l8 8' stroke='#fff' stroke-width='4.5' stroke-linecap='round'/>") },
    { id: 'wiki', name: 'Wikipedia', title: 'Wikipedia, the free encyclopedia', icon: svg("<circle cx='24' cy='24' r='21' fill='#fff' stroke='#888' stroke-width='2'/><text x='24' y='32' font-family='Georgia,serif' font-size='24' text-anchor='middle' fill='#222'>W</text>") },
  ];

  let original = null;
  function iconLink() {
    let link = document.querySelector('link[rel~="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    return link;
  }
  function apply(id) {
    const link = iconLink();
    if (!original) original = { title: document.title, icon: link.href };
    const o = OPTIONS.find((x) => x.id === id) || OPTIONS[0];
    if (o.title) { document.title = o.title; link.type = 'image/svg+xml'; link.href = o.icon; }
    else { document.title = original.title; link.href = original.icon; }
  }
  function current() { try { return localStorage.getItem(KEY) || 'off'; } catch (e) { return 'off'; } }
  function set(id) {
    try { localStorage.setItem(KEY, id); } catch (e) { /* private mode */ }
    apply(id);
  }
  return { OPTIONS, current, set, init: () => apply(current()) };
})();
