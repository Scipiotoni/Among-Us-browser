# Browser Imposter 🚀

A free, browser-based multiplayer social deduction game to play with friends. Crewmates fix the ship and hunt for the traitors; Impostors sabotage, vent and eliminate the crew.

No downloads for players: one person hosts the server and everyone else just opens a link.

**▶ Play: https://scipiotoni.github.io/Among-Us-browser/**

> This is an original fan project inspired by the social deduction genre. All art (characters, map, UI) is drawn in code and all sounds are synthesized. It contains no official assets and isn't affiliated with any commercial game.

## Features

- **Online lobbies** with 5-letter codes, invite links, and a public lobby browser
- **Host & admins:** the host (👑) can promote admins (🛡), transfer host, kick, ban, mute, lock the lobby, change settings, and start or force-end games
- **Walkable lobby** with a wardrobe and a settings terminal
- **Customization & cookie shop:** 18 colors (unique per lobby), plus 137 cosmetics across hats, eyes, outfits and pets. Many are free; the rest cost 🍪 cookies.
- **6 maps + 3 event maps:** Station Helix, Polar Base, Skyport, Abyss Station, Dune Outpost and Asteroid Mine (or Random), plus each event's map while it runs, each with its own layout, look and animated background. The new maps are built from a short grid description by `gridMap` in `shared/map.js`, which places every task, vent, camera and prop.
- **Chat:** message bubbles in each player's color, name highlights and pings, and a player list (👥) to click someone's name into your message.
- **★ Kill Animations:** 21 animations (laser zap, anvil, black hole, rocket, freeze ray, UFO, banana, boxing glove, pistol quick-draw, backstab, sword slash, bow, piano, meteor, lightning, plus two per event). Each is its own 1% "Rare Special" box prize that you keep forever; equip one in the Shop's ✨ Kill FX tab and it plays for the killer and victim on every kill (`public/js/killanim.js`).
- **Events (two weeks each):** 🎃 Halloween (Oct 18–31), 🎄 Christmas (Dec 12–25) and 🏖️ Summer Kickoff (Jun 21–Jul 4). Each has its own map (Haunted Manor, Santa's Workshop, Beach Resort), an event shop, an event box with exclusives and two event kill animations. Event items stay owned after the event. Dates live in `shared/events.js`; add `?event=christmas` (or `halloween`, `summer`) to the URL to preview one.
- **Mystery Boxes:** 🍪 150 each; a case-style spin wins one of 57 exclusive, unbuyable items (Rare 61%, Epic 27%, Legendary 9%, Mythic 2%, ★ Rare Special 1%). Duplicates refund 🍪 60.
- **Hide tab:** disguise the browser tab's title and icon as Google Docs, Slides, Sheets, Drive, Classroom, Canva, Khan Academy, Quizlet or Wikipedia (generic icons drawn in code, not the real logos).
- **Cookies:** earned at the end of every game: +2 per task step, +20 for winning, +4 per kill as an Impostor, +5 for playing (games over 1 minute). New players start with 50. Cookies and purchases are saved in each player's browser.
- **Roles**
  - Crew: Crewmate, **Engineer** (vents), **Scientist** (portable vitals), **Tracker** (follow a player), **Noisemaker** (alerts everyone on death), **Guardian** (shields players after death), **Detective** (examines bodies to get two suspects)
  - Impostors: Impostor, **Shapeshifter** (disguise), **Phantom** (invisibility), **Viper** (bodies dissolve)
  - Every role has a count, a chance %, and its own tunable options
- **Map "Station Helix"** with 12 rooms, line-of-sight fog of war, closable doors, and 4 vent networks
- **23 task minigames:** wires, card swipe, upload/download, refuel, reactor sequence, asteroids, divert power, manifolds, calibrate, shields, O2 filter, garbage, engine alignment, chart course, steering, med scan (visual), blood analysis, antenna tuning, and more
- **Sabotage:** reactor meltdown (two players must hold pads at once), oxygen (two keypads), lights, comms, and door locks
- **Consoles:** security cameras, admin map, vitals
- **Meetings:** emergency button and body reports, discussion and voting timers, skip votes, anonymous votes, confirm ejects, chat, ejection screen
- **Ghosts** can still do tasks and chat with other ghosts
- **All the usual game settings:** kill cooldown and distance, vision, speed, task counts, task bar mode, meeting rules, max players, and more
- **Mobile friendly:** touch joystick and big action buttons

## How it works (no server!)

There is no game server to keep running, so there's no waiting for one to wake up. Like Casino-simulator, multiplayer goes through a free public **MQTT broker** over secure WebSockets (`broker.emqx.io`, with `broker.hivemq.com` as a fallback). The browser of whoever **creates a lobby runs the game** for that lobby; everyone else sends their moves to it and gets the game state back. The site itself is just static files on GitHub Pages.

- **Accounts:** sign up with a username and password to keep cookies, purchases and your look on every device. Each account is saved, encrypted with a key made from the password, as a retained message on both brokers (and cached on each device that logs in). The newest copy wins, and missing copies are rewritten automatically. Guests keep cookies in their browser only.
- **Trade-offs:** the lobby closes if the host leaves or loses connection, so the host should keep the game open (a background tab is fine). Public brokers are open to anyone and promise no uptime; a determined player could read game messages or edit their own cookies with developer tools. Some school or office networks block the broker's port (8084/8884). Don't reuse an important password for your account.
- **Own broker:** add `?mqtt=wss://your-broker/mqtt` to the page URL, or set `window.MQTT_BROKERS` in `public/js/config.js`.

## Run it

Play at **https://scipiotoni.github.io/Among-Us-browser/**. Every push to `main` republishes it (`.github/workflows/pages.yml`).

To run it on your computer (Node.js 18+):

```bash
npm install
npm start
```

Then open http://localhost:3000. It still uses the public brokers for multiplayer, so friends on the Pages site and on your local copy can play together. To test alone, open several browser windows; a solo game gives you a crewmate with no impostors, so you can try the tasks.

Click **🔗 Invite** in the lobby to copy a link that pre-fills your lobby code.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD / arrows | Drag on the left side of the screen |
| Use / task / repair | E or Space | USE button |
| Report body | R | REPORT |
| Kill (impostor) | Q | KILL |
| Vent | V | VENT |
| Role ability | F | Ability button |
| Map / sabotage map | Tab or M | 🗺️ |
| Chat | Enter | 💬 |
| Close panel | Esc | ✕ |

## Project layout

```
server/index.js     Local static file server (the game needs no server)
shared/room.js      Authoritative game logic, run by the lobby host's browser (lobby, roles, kills, meetings, sabotage, win checks)
shared/constants.js Colors, roles, settings schema
shared/cosmetics.js Cosmetics catalog with cookie prices, and reward amounts
shared/map.js       Map geometry, vents, stations, tasks, collision / line-of-sight helpers
public/js/draw.js   Character, cosmetics and pet rendering
public/js/world.js  Map pre-render and field-of-view
public/js/game.js   Client engine: movement, rendering, interactions, HUD, map, cameras
public/js/tasks.js  Task minigames and sabotage repair panels
public/js/ui.js     Menus, wardrobe, settings, admin panel, chat, meetings, overlays
public/js/mqtt.js   Tiny MQTT client + background-safe timers
public/js/net.js    Serverless multiplayer: hosting and joining lobbies over MQTT
public/js/accounts.js Accounts (encrypted cloud saves) and the cookie wallet
public/js/cloak.js  Hide tab (disguised title and icon)
public/js/main.js   Event wiring and bootstrap
```
