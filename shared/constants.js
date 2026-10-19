// Shared constants used by both the server (require) and the browser (window.SHARED).
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.SHARED = root.SHARED || {}; Object.assign(root.SHARED, mod); }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const COLORS = [
    { id: 'red', name: 'Red', body: '#d42b2b', shade: '#83122a' },
    { id: 'blue', name: 'Blue', body: '#2340d8', shade: '#121f8a' },
    { id: 'green', name: 'Green', body: '#1c8a38', shade: '#0d5230' },
    { id: 'pink', name: 'Pink', body: '#ef5fc0', shade: '#a933a8' },
    { id: 'orange', name: 'Orange', body: '#f38a1c', shade: '#b4471b' },
    { id: 'yellow', name: 'Yellow', body: '#f7ef5e', shade: '#c4902a' },
    { id: 'black', name: 'Black', body: '#454d55', shade: '#22232b' },
    { id: 'white', name: 'White', body: '#dfe6f2', shade: '#8a99c2' },
    { id: 'purple', name: 'Purple', body: '#7535c4', shade: '#3e1a80' },
    { id: 'brown', name: 'Brown', body: '#7a5024', shade: '#5a2817' },
    { id: 'cyan', name: 'Cyan', body: '#45f5dc', shade: '#26a3b8' },
    { id: 'lime', name: 'Lime', body: '#5ff046', shade: '#1fa346' },
    { id: 'maroon', name: 'Maroon', body: '#66232a', shade: '#431b20' },
    { id: 'rose', name: 'Rose', body: '#f0c6d8', shade: '#d795b2' },
    { id: 'banana', name: 'Banana', body: '#f2eab0', shade: '#cdb98a' },
    { id: 'gray', name: 'Gray', body: '#7b8b98', shade: '#495868' },
    { id: 'tan', name: 'Tan', body: '#978d7c', shade: '#544541' },
    { id: 'coral', name: 'Coral', body: '#dd6a6a', shade: '#b04752' },
  ];

  const HATS = [
    { id: 'none', name: 'None' }, { id: 'cap', name: 'Ball Cap' }, { id: 'tophat', name: 'Top Hat' },
    { id: 'crown', name: 'Crown' }, { id: 'beanie', name: 'Beanie' }, { id: 'party', name: 'Party Hat' },
    { id: 'halo', name: 'Halo' }, { id: 'horns', name: 'Devil Horns' }, { id: 'chef', name: 'Chef Hat' },
    { id: 'cowboy', name: 'Cowboy Hat' }, { id: 'flower', name: 'Flower' }, { id: 'headphones', name: 'Headphones' },
    { id: 'antlers', name: 'Antlers' }, { id: 'pirate', name: 'Pirate Hat' }, { id: 'wizard', name: 'Wizard Hat' },
    { id: 'bow', name: 'Bow' }, { id: 'helmet', name: 'Space Helmet' }, { id: 'sprout', name: 'Sprout' },
  ];
  const EYES = [
    { id: 'normal', name: 'Normal' }, { id: 'happy', name: 'Happy' }, { id: 'angry', name: 'Angry' },
    { id: 'sleepy', name: 'Sleepy' }, { id: 'cyclops', name: 'Cyclops' }, { id: 'shades', name: 'Shades' },
    { id: 'goggles', name: 'Goggles' }, { id: 'hearts', name: 'Hearts' }, { id: 'stars', name: 'Starry' },
  ];
  const OUTFITS = [
    { id: 'none', name: 'None' }, { id: 'scarf', name: 'Scarf' }, { id: 'tie', name: 'Necktie' },
    { id: 'suit', name: 'Suit' }, { id: 'cape', name: 'Cape' }, { id: 'labcoat', name: 'Lab Coat' },
    { id: 'overalls', name: 'Overalls' }, { id: 'stars', name: 'Star Pattern' }, { id: 'bowtie', name: 'Bow Tie' },
  ];
  const PETS = [
    { id: 'none', name: 'None' }, { id: 'drone', name: 'Mini Drone' }, { id: 'kitty', name: 'Kitty' },
    { id: 'slime', name: 'Slime' }, { id: 'ufo', name: 'Tiny UFO' }, { id: 'duck', name: 'Duckling' },
    { id: 'robot', name: 'Robo Pal' },
  ];

  // team: 'crew' or 'impostor'. options are per-role tunables shown in the lobby settings.
  const ROLES = {
    crewmate: { team: 'crew', name: 'Crewmate', color: '#8ad3ff', desc: 'Complete your tasks and vote out the Impostors.' },
    engineer: {
      team: 'crew', name: 'Engineer', color: '#ff9f43', desc: 'You can use vents to move around the ship.',
      options: [
        { key: 'ventCooldown', label: 'Vent Use Cooldown', min: 0, max: 60, step: 5, def: 20, unit: 's' },
        { key: 'ventDuration', label: 'Max Time in Vents', min: 5, max: 60, step: 5, def: 10, unit: 's' },
      ],
    },
    scientist: {
      team: 'crew', name: 'Scientist', color: '#54a0ff', desc: 'Check the vitals of the crew from anywhere.',
      options: [
        { key: 'vitalsCooldown', label: 'Vitals Cooldown', min: 5, max: 60, step: 5, def: 15, unit: 's' },
        { key: 'vitalsDuration', label: 'Battery Duration', min: 5, max: 30, step: 5, def: 10, unit: 's' },
      ],
    },
    tracker: {
      team: 'crew', name: 'Tracker', color: '#1dd1a1', desc: 'Tag a nearby player to follow their location for a while.',
      options: [
        { key: 'trackCooldown', label: 'Tracking Cooldown', min: 5, max: 60, step: 5, def: 25, unit: 's' },
        { key: 'trackDuration', label: 'Tracking Duration', min: 5, max: 60, step: 5, def: 20, unit: 's' },
      ],
    },
    noisemaker: {
      team: 'crew', name: 'Noisemaker', color: '#feca57', desc: 'When you die, everyone is alerted to your body.',
      options: [
        { key: 'alertDuration', label: 'Alert Duration', min: 3, max: 20, step: 1, def: 10, unit: 's' },
        { key: 'impostorsAlerted', label: 'Impostors Get Alert', type: 'bool', def: true },
      ],
    },
    guardian: {
      team: 'crew', name: 'Guardian', color: '#c8d6e5', desc: 'After you die, shield living players from attacks.',
      options: [
        { key: 'protectCooldown', label: 'Protect Cooldown', min: 10, max: 90, step: 5, def: 35, unit: 's' },
        { key: 'protectDuration', label: 'Protection Duration', min: 5, max: 30, step: 5, def: 10, unit: 's' },
      ],
    },
    detective: {
      team: 'crew', name: 'Detective', color: '#a29bfe', desc: 'Examine a body to narrow the killer down to two suspects.',
      options: [
        { key: 'examineCooldown', label: 'Examine Cooldown', min: 10, max: 90, step: 5, def: 30, unit: 's' },
      ],
    },
    impostor: { team: 'impostor', name: 'Impostor', color: '#ff3b3b', desc: 'Sabotage and eliminate the crew. Don\'t get caught.' },
    shapeshifter: {
      team: 'impostor', name: 'Shapeshifter', color: '#ff6b81', desc: 'Disguise yourself as another player.',
      options: [
        { key: 'shiftDuration', label: 'Shapeshift Duration', min: 5, max: 60, step: 5, def: 30, unit: 's' },
        { key: 'shiftCooldown', label: 'Shapeshift Cooldown', min: 5, max: 60, step: 5, def: 15, unit: 's' },
      ],
    },
    phantom: {
      team: 'impostor', name: 'Phantom', color: '#b33771', desc: 'Turn invisible for a short time. You can\'t attack while vanished.',
      options: [
        { key: 'vanishDuration', label: 'Vanish Duration', min: 5, max: 30, step: 5, def: 15, unit: 's' },
        { key: 'vanishCooldown', label: 'Vanish Cooldown', min: 5, max: 60, step: 5, def: 25, unit: 's' },
      ],
    },
    viper: {
      team: 'impostor', name: 'Viper', color: '#2ed573', desc: 'Your victims dissolve without a trace after a while.',
      options: [
        { key: 'dissolveTime', label: 'Body Dissolve Time', min: 5, max: 60, step: 5, def: 15, unit: 's' },
      ],
    },
  };
  const SPECIAL_CREW = ['engineer', 'scientist', 'tracker', 'noisemaker', 'guardian', 'detective'];
  const SPECIAL_IMPOSTOR = ['shapeshifter', 'phantom', 'viper'];

  const SETTINGS_SCHEMA = [
    { group: 'Lobby' },
    { key: 'isPublic', label: 'Public Lobby', type: 'bool', def: true },
    { key: 'maxPlayers', label: 'Max Players', min: 4, max: 15, step: 1, def: 15 },
    { group: 'Impostors' },
    { key: 'impostors', label: 'Impostors', min: 1, max: 3, step: 1, def: 1 },
    { key: 'killCooldown', label: 'Kill Cooldown', min: 10, max: 60, step: 2.5, def: 30, unit: 's' },
    { key: 'killDistance', label: 'Kill Distance', type: 'select', options: ['Short', 'Medium', 'Long'], def: 1 },
    { key: 'impostorVision', label: 'Impostor Vision', min: 0.25, max: 3, step: 0.25, def: 1.5, unit: 'x' },
    { group: 'Crewmates' },
    { key: 'crewVision', label: 'Crewmate Vision', min: 0.25, max: 3, step: 0.25, def: 1, unit: 'x' },
    { key: 'playerSpeed', label: 'Player Speed', min: 0.5, max: 3, step: 0.25, def: 1, unit: 'x' },
    { group: 'Meetings' },
    { key: 'emergencyMeetings', label: 'Emergency Meetings', min: 0, max: 9, step: 1, def: 1 },
    { key: 'emergencyCooldown', label: 'Emergency Cooldown', min: 0, max: 60, step: 5, def: 15, unit: 's' },
    { key: 'discussionTime', label: 'Discussion Time', min: 0, max: 120, step: 15, def: 15, unit: 's' },
    { key: 'votingTime', label: 'Voting Time', min: 15, max: 300, step: 15, def: 120, unit: 's' },
    { key: 'anonymousVotes', label: 'Anonymous Votes', type: 'bool', def: false },
    { key: 'confirmEjects', label: 'Confirm Ejects', type: 'bool', def: true },
    { group: 'Tasks' },
    { key: 'taskBarUpdates', label: 'Task Bar Updates', type: 'select', options: ['Always', 'Meetings', 'Never'], def: 0 },
    { key: 'visualTasks', label: 'Visual Tasks', type: 'bool', def: true },
    { key: 'commonTasks', label: 'Common Tasks', min: 0, max: 2, step: 1, def: 1 },
    { key: 'longTasks', label: 'Long Tasks', min: 0, max: 3, step: 1, def: 1 },
    { key: 'shortTasks', label: 'Short Tasks', min: 0, max: 5, step: 1, def: 2 },
  ];

  function defaultSettings() {
    const s = {};
    for (const f of SETTINGS_SCHEMA) if (f.key) s[f.key] = f.def;
    s.roles = {};
    for (const r of [...SPECIAL_CREW, ...SPECIAL_IMPOSTOR]) {
      const o = { count: 0, chance: 100 };
      for (const opt of ROLES[r].options || []) o[opt.key] = opt.def;
      s.roles[r] = o;
    }
    return s;
  }

  return {
    COLORS, HATS, EYES, OUTFITS, PETS, ROLES, SPECIAL_CREW, SPECIAL_IMPOSTOR, SETTINGS_SCHEMA,
    defaultSettings,
    PLAYER_RADIUS: 16,
    BASE_SPEED: 250,          // world units / second
    BASE_VISION: 360,         // world units
    KILL_DISTANCES: [85, 125, 175],
    USE_RANGE: 95,
    REPORT_RANGE: 140,
    SABOTAGE_CRITICAL_TIME: 45,
    SABOTAGE_COOLDOWN: 30,
    DOOR_CLOSE_TIME: 10,
    DOOR_COOLDOWN: 30,
    MAX_NAME: 12,
  };
});
