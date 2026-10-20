// Cosmetics catalog with cookie prices (0 = free). `draw` picks the renderer in public/js/draw.js;
// the remaining fields are parameters for it. Shared by the server (id validation) and the browser.
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.SHARED = root.SHARED || {}; Object.assign(root.SHARED, mod); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const H = (id, name, price, draw, extra) => ({ id, name, price, draw, ...extra });
  // Box-only exclusives: no price, can't be bought, only won from Mystery Boxes.
  const X = (rarity, id, name, draw, extra) => ({ id, name, price: null, rarity, draw, ...extra });

  const HATS = [
    H('none', 'None', 0, 'none', { ant: true }),
    H('cap', 'Red Cap', 0, 'cap', { c: '#e74c3c', c2: '#c0392b' }),
    H('beanie', 'Purple Beanie', 0, 'beanie', { c: '#6c5ce7', c2: '#a29bfe', c3: '#fd79a8' }),
    H('party', 'Party Hat', 0, 'party', { c: '#00cec9' }),
    H('flower', 'Daisy', 0, 'flower', { c: '#fd79a8', c2: '#fdcb6e', ant: true }),
    H('sprout', 'Sprout', 0, 'sprout', { ant: true }),
    H('headphones', 'Headphones', 0, 'headphones', { c: '#0984e3', ant: true }),
    H('bow', 'Pink Bow', 0, 'bow', { c: '#ff6b81', ant: true }),
    H('bandana', 'Red Bandana', 0, 'bandana', { c: '#d63031', ant: true }),
    H('cap_blue', 'Blue Cap', 25, 'cap', { c: '#0984e3', c2: '#074f8a' }),
    H('cap_green', 'Green Cap', 25, 'cap', { c: '#00b894', c2: '#00866b' }),
    H('cap_yellow', 'Yellow Cap', 25, 'cap', { c: '#fdcb6e', c2: '#e1a32a' }),
    H('cap_pink', 'Pink Cap', 25, 'cap', { c: '#fd79a8', c2: '#d6517f' }),
    H('cap_black', 'Black Cap', 30, 'cap', { c: '#2d3436', c2: '#111' }),
    H('bow_blue', 'Blue Bow', 30, 'bow', { c: '#74b9ff', ant: true }),
    H('beanie_orange', 'Orange Beanie', 30, 'beanie', { c: '#e17055', c2: '#fab1a0', c3: '#fff' }),
    H('beanie_green', 'Green Beanie', 30, 'beanie', { c: '#00b894', c2: '#55efc4', c3: '#ffeaa7' }),
    H('beanie_white', 'Snow Beanie', 30, 'beanie', { c: '#dfe6e9', c2: '#74b9ff', c3: '#74b9ff' }),
    H('party_pink', 'Pink Party Hat', 30, 'party', { c: '#fd79a8' }),
    H('bandana_blue', 'Blue Bandana', 40, 'bandana', { c: '#0984e3', ant: true }),
    H('bucket', 'Bucket Hat', 50, 'bucket', { c: '#c8b38a' }),
    H('headphones_pink', 'Pink Headphones', 50, 'headphones', { c: '#fd79a8', ant: true }),
    H('party_gold', 'Golden Party Hat', 60, 'party', { c: '#f9ca24' }),
    H('tophat', 'Top Hat', 60, 'tophat', { c: '#222', c2: '#c0392b' }),
    H('hardhat', 'Hard Hat', 60, 'hardhat', { c: '#fdcb6e' }),
    H('beret', 'Beret', 60, 'beret', { c: '#2d3436' }),
    H('sunflower', 'Sunflower', 60, 'flower', { c: '#f9ca24', c2: '#6d4c41', ant: true }),
    H('tophat_white', 'White Top Hat', 70, 'tophat', { c: '#f5f6fa', c2: '#0984e3' }),
    H('catears', 'Cat Ears', 70, 'catears', { body: true, ant: true }),
    H('eggshell', 'Eggshell', 70, 'eggshell'),
    H('fez', 'Fez', 70, 'fez', { c: '#c0392b' }),
    H('toast', 'Toast', 75, 'toast'),
    H('chef', 'Chef Hat', 80, 'chef'),
    H('bunny', 'Bunny Ears', 80, 'bunny', { c: '#f5f6fa', ant: true }),
    H('plunger', 'Plunger', 80, 'plunger'),
    H('tophat_purple', 'Magician Hat', 90, 'tophat', { c: '#4b2a7a', c2: '#f9ca24' }),
    H('cowboy', 'Cowboy Hat', 90, 'cowboy', { c: '#a0522d', c2: '#5d2e0c' }),
    H('propeller', 'Propeller Cap', 90, 'propeller'),
    H('mushroom', 'Mushroom', 90, 'mushroom'),
    H('cheese', 'Cheese Wedge', 90, 'cheese'),
    H('antlers', 'Antlers', 100, 'antlers', { ant: true }),
    H('gradcap', 'Graduation Cap', 100, 'gradcap'),
    H('police', 'Police Cap', 110, 'police'),
    H('cowboy_black', 'Outlaw Hat', 110, 'cowboy', { c: '#2d3436', c2: '#b2bec3' }),
    H('halo', 'Halo', 120, 'halo', { ant: true }),
    H('horns', 'Devil Horns', 120, 'horns', { ant: true }),
    H('santa', 'Santa Hat', 120, 'santa'),
    H('sombrero', 'Sombrero', 120, 'sombrero'),
    H('witch', 'Witch Hat', 130, 'witch'),
    H('pirate', 'Pirate Hat', 140, 'pirate'),
    H('laurel', 'Laurel Wreath', 140, 'laurel', { ant: true }),
    H('crown_silver', 'Silver Crown', 150, 'crown', { c: '#dfe6e9', c2: '#0984e3' }),
    H('viking', 'Viking Helmet', 150, 'viking'),
    H('chick', 'Chick Buddy', 150, 'chick'),
    H('wizard', 'Wizard Hat', 160, 'wizard', { c: '#4834d4' }),
    H('wizard_red', 'Fire Wizard Hat', 160, 'wizard', { c: '#b71540' }),
    H('tiara', 'Tiara', 180, 'tiara', { ant: true }),
    H('helmet', 'Space Bubble', 200, 'helmet'),
    H('unicorn', 'Unicorn Horn', 200, 'unicorn', { ant: true }),
    H('raincloud', 'Rain Cloud', 250, 'raincloud', { ant: true }),
    H('crown', 'Gold Crown', 300, 'crown', { c: '#f9ca24', c2: '#e84393' }),
    H('flame', 'Head Flame', 300, 'flame'),
    H('rainbow', 'Rainbow', 350, 'rainbow', { ant: true }),
    H('crown_ruby', 'Ruby Crown', 450, 'crown', { c: '#e84393', c2: '#f9ca24' }),
    X('rare', 'x_icecrown', 'Ice Crown', 'crown', { c: '#dff9fb', c2: '#74b9ff' }),
    X('rare', 'x_lavahorns', 'Lava Horns', 'horns', { c: '#ff7f00', ant: true }),
    X('rare', 'x_shadowwizard', 'Shadow Wizard Hat', 'wizard', { c: '#1e1e2e' }),
    X('epic', 'x_goldtophat', 'Golden Top Hat', 'tophat', { c: '#f9ca24', c2: '#111' }),
    X('epic', 'x_goldantlers', 'Golden Antlers', 'antlers', { c: '#f9ca24', ant: true }),
    X('epic', 'x_diamondcrown', 'Diamond Crown', 'crown', { c: '#a8e6ff', c2: '#ffffff', shine: true }),
    X('legendary', 'x_blueflame', 'Blue Flame', 'flame', { c: ['#0652dd', '#1289a7', '#c7ecee'] }),
    X('legendary', 'x_rainbowhalo', 'Rainbow Halo', 'halo', { rainbow: true, ant: true }),
    X('mythic', 'x_orbit', 'Tiny Solar System', 'orbit', { ant: true }),
  ];

  const EYES = [
    H('normal', 'Normal', 0, 'normal'),
    H('happy', 'Happy', 0, 'happy'),
    H('angry', 'Angry', 0, 'angry'),
    H('sleepy', 'Sleepy', 0, 'sleepy'),
    H('wink', 'Wink', 30, 'wink'),
    H('cute', 'Sparkly', 40, 'cute'),
    H('tired', 'Tired', 40, 'tired'),
    H('cyclops', 'Cyclops', 40, 'cyclops'),
    H('glasses', 'Round Glasses', 50, 'glasses', { c: '#2d3436' }),
    H('shades', 'Shades', 60, 'shades', { c: '#111' }),
    H('goggles', 'Goggles', 60, 'goggles'),
    H('eyepatch', 'Eye Patch', 70, 'eyepatch'),
    H('hearts', 'Heart Eyes', 80, 'hearts'),
    H('stars', 'Starry', 80, 'stars'),
    H('glasses_gold', 'Gold Glasses', 90, 'glasses', { c: '#f9ca24' }),
    H('cat', 'Cat Eyes', 90, 'cat'),
    H('three_d', '3D Glasses', 90, 'three_d'),
    H('spiral', 'Dizzy', 100, 'spiral'),
    H('shades_pink', 'Pink Shades', 100, 'shades', { c: '#e84393' }),
    H('monocle', 'Monocle', 120, 'monocle'),
    H('robot', 'Robot Eyes', 120, 'robot'),
    H('dollar', 'Money Eyes', 150, 'dollar'),
    H('pixel', 'Pixel Shades', 180, 'pixel'),
    H('laser', 'Laser Eyes', 200, 'laser'),
    X('rare', 'x_void', 'Void Eyes', 'void'),
    X('rare', 'x_rainbowshades', 'Rainbow Shades', 'shades', { rainbow: true }),
    X('epic', 'x_fireeyes', 'Fire Eyes', 'laser', { c: '#ff9f1a', c2: 'rgba(255,159,26,' }),
    X('epic', 'x_diamondeyes', 'Diamond Eyes', 'stars', { c: '#a8e6ff' }),
    X('legendary', 'x_galaxyeyes', 'Galaxy Eyes', 'galaxyeyes'),
  ];

  const OUTFITS = [
    H('none', 'None', 0, 'none'),
    H('scarf', 'Red Scarf', 0, 'scarf', { c: '#e84118', c2: '#c23616' }),
    H('tie', 'Necktie', 0, 'tie', { c: '#2f3640' }),
    H('bowtie', 'Bow Tie', 0, 'bowtie', { c: '#c0392b', c2: '#922b21' }),
    H('heart', 'Heart Patch', 0, 'heart'),
    H('scarf_blue', 'Blue Scarf', 30, 'scarf', { c: '#0984e3', c2: '#074f8a' }),
    H('scarf_green', 'Green Scarf', 30, 'scarf', { c: '#00b894', c2: '#00866b' }),
    H('tie_red', 'Red Tie', 30, 'tie', { c: '#c0392b' }),
    H('belt', 'Belt', 40, 'belt'),
    H('apron', 'Apron', 60, 'apron'),
    H('overalls', 'Overalls', 70, 'overalls'),
    H('vest', 'Life Vest', 70, 'vest'),
    H('bolt', 'Lightning Bolt', 70, 'bolt'),
    H('backpack', 'Backpack', 80, 'backpack', { back: true }),
    H('sash', 'Ninja Sash', 80, 'sash'),
    H('bowtie_gold', 'Gold Bow Tie', 80, 'bowtie', { c: '#f9ca24', c2: '#c49a00' }),
    H('labcoat', 'Lab Coat', 90, 'labcoat'),
    H('polka', 'Polka Dots', 90, 'pattern', { p: 'polka' }),
    H('tutu', 'Tutu', 90, 'tutu'),
    H('lei', 'Flower Lei', 90, 'lei'),
    H('stars', 'Star Pattern', 100, 'pattern', { p: 'stars' }),
    H('sheriff', 'Sheriff Badge', 100, 'sheriff'),
    H('suit', 'Suit', 120, 'suit', { c: '#2d3436', c2: '#d63031' }),
    H('camo', 'Camo', 120, 'pattern', { p: 'camo' }),
    H('zombie', 'Zombie Patches', 120, 'pattern', { p: 'zombie' }),
    H('scarf_rainbow', 'Rainbow Scarf', 120, 'scarf', { rainbow: true }),
    H('tiger', 'Tiger Stripes', 140, 'pattern', { p: 'tiger' }),
    H('cape', 'Red Cape', 150, 'cape', { c: '#b3202a', back: true }),
    H('cape_blue', 'Blue Cape', 150, 'cape', { c: '#1e3799', back: true }),
    H('cape_purple', 'Purple Cape', 150, 'cape', { c: '#6c3483', back: true }),
    H('suit_white', 'White Suit', 150, 'suit', { c: '#f5f6fa', c2: '#0984e3' }),
    H('medal', 'Gold Medal', 150, 'medal'),
    H('chain', 'Gold Chain', 200, 'chain'),
    H('rainbow_belly', 'Rainbow Belly', 200, 'pattern', { p: 'rainbow' }),
    H('cape_gold', 'Royal Cape', 300, 'cape', { c: '#f1c40f', back: true }),
    H('galaxy', 'Galaxy', 300, 'pattern', { p: 'galaxy' }),
    X('rare', 'x_lava', 'Lava Skin', 'pattern', { p: 'lava' }),
    X('rare', 'x_ice', 'Frozen Skin', 'pattern', { p: 'ice' }),
    X('rare', 'x_shadowcape', 'Shadow Cape', 'cape', { c: '#151520', back: true }),
    X('epic', 'x_goldarmor', 'Golden Armor', 'armor', { c: '#f9ca24', c2: '#c49a00' }),
    X('epic', 'x_fireaura', 'Fire Aura', 'aura', { c: ['#ff4d00', '#ffb300'], back: true }),
    X('legendary', 'x_diamondarmor', 'Diamond Armor', 'armor', { c: '#a8e6ff', c2: '#4aa8d8' }),
    X('legendary', 'x_rainbowaura', 'Rainbow Aura', 'aura', { rainbow: true, back: true }),
    X('mythic', 'x_wings', 'Phoenix Wings', 'wings', { back: true }),
  ];

  const PETS = [
    H('none', 'None', 0, 'none'),
    H('slime', 'Slime', 0, 'slime', { c: 'rgba(85,239,196,0.85)' }),
    H('rock', 'Pet Rock', 20, 'rock'),
    H('slime_pink', 'Pink Slime', 60, 'slime', { c: 'rgba(253,121,168,0.85)' }),
    H('snail', 'Snail', 80, 'snail'),
    H('cactus', 'Cactus', 90, 'cactus'),
    H('duck', 'Duckling', 100, 'duck'),
    H('bee', 'Bee', 100, 'bee'),
    H('kitty', 'Kitty', 120, 'kitty', { c: '#fab1a0' }),
    H('kitty_gray', 'Gray Kitty', 120, 'kitty', { c: '#b2bec3' }),
    H('kitty_black', 'Black Kitty', 120, 'kitty', { c: '#3d3d3d' }),
    H('puppy', 'Puppy', 120, 'puppy'),
    H('bunny', 'Bunny', 120, 'bunnypet'),
    H('fishbowl', 'Fish Bowl', 140, 'fishbowl'),
    H('drone', 'Mini Drone', 150, 'drone'),
    H('robot', 'Robo Pal', 150, 'robot'),
    H('penguin', 'Penguin', 160, 'penguin'),
    H('ghost', 'Ghosty', 180, 'ghostpet'),
    H('ufo', 'Tiny UFO', 200, 'ufo'),
    H('star', 'Star Buddy', 220, 'starpet'),
    H('miniblob', 'Mini Me', 250, 'miniblob'),
    H('dragon', 'Baby Dragon', 400, 'dragon'),
    X('rare', 'x_shadowkitty', 'Shadow Kitty', 'kitty', { c: '#1e1e2e', eye: '#ff4757' }),
    X('rare', 'x_iceslime', 'Ice Slime', 'slime', { c: 'rgba(116,185,255,0.85)' }),
    X('epic', 'x_blackhole', 'Pocket Black Hole', 'blackhole'),
    X('legendary', 'x_golddragon', 'Golden Dragon', 'dragon', { c: '#f9ca24' }),
    X('legendary', 'x_unicorn', 'Rainbow Unicorn', 'unicornpet'),
    X('mythic', 'x_phoenix', 'Phoenix', 'phoenix'),
  ];

  // Kill effects: the box-only special makes every kill play a random cartoon animation.
  const ANIMS = [
    H('none', 'Default', 0, 'none'),
    X('special', 'killanims', '★ Kill Animations', 'killanims'),
  ];
  const KILL_ANIMS = ['zap', 'anvil', 'blackhole', 'rocket', 'freeze', 'ufo', 'banana', 'glove'];

  const COSMETICS = { hat: HATS, eyes: EYES, outfit: OUTFITS, pet: PETS, anim: ANIMS };
  const COSMETIC_DEFAULTS = { hat: 'none', eyes: 'normal', outfit: 'none', pet: 'none', anim: 'none' };
  const COSMETIC_BY_ID = {};
  for (const cat in COSMETICS) {
    COSMETIC_BY_ID[cat] = {};
    for (const item of COSMETICS[cat]) COSMETIC_BY_ID[cat][item.id] = item;
  }

  // Mystery Box: chances (in %) of each rarity, then an equal chance for each item of that rarity.
  const RARITIES = {
    rare: { name: 'Rare', color: '#3498db', chance: 61 },
    epic: { name: 'Epic', color: '#a55eea', chance: 27 },
    legendary: { name: 'Legendary', color: '#f7b731', chance: 9 },
    mythic: { name: 'Mythic', color: '#ff4757', chance: 2 },
    special: { name: '★ Rare Special', color: '#e4ae39', chance: 1 },
  };
  const BOX = { price: 150, duplicateRefund: 60 };
  const BOX_POOL = [];
  for (const cat in COSMETICS) for (const item of COSMETICS[cat]) if (item.rarity) BOX_POOL.push({ cat, item });
  function rollBox(rand = Math.random) {
    let r = rand() * 100, rarity = 'rare';
    for (const k in RARITIES) { if (r < RARITIES[k].chance) { rarity = k; break; } r -= RARITIES[k].chance; }
    const pool = BOX_POOL.filter((x) => x.item.rarity === rarity);
    return pool[Math.floor(rand() * pool.length)];
  }

  // Cookies earned at the end of a game.
  const REWARDS = { played: 5, win: 20, perTaskStep: 2, perKill: 4, minGameSeconds: 60, starting: 50 };

  return { COSMETICS, COSMETIC_DEFAULTS, COSMETIC_BY_ID, REWARDS, RARITIES, BOX, BOX_POOL, rollBox, KILL_ANIMS };
});
