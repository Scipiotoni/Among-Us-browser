# Sus Station 🚀

A free, browser-based multiplayer social deduction game to play with friends. Crewmates fix the ship and hunt for the traitors; Impostors sabotage, vent and eliminate the crew.

No downloads for players: one person hosts the server and everyone else just opens a link.

> This is an original fan project inspired by the social deduction genre. All art (characters, map, UI) is drawn in code and all sounds are synthesized. It contains no official assets and isn't affiliated with any commercial game.

## Features

- **Online lobbies** with 5-letter codes, invite links, and a public lobby browser
- **Host & admins:** the host (👑) can promote admins (🛡), transfer host, kick, ban, mute, lock the lobby, change settings, and start or force-end games
- **Walkable lobby** with a wardrobe and a settings terminal
- **Customization:** 18 colors (unique per lobby), 18 hats, 9 eye styles, 9 outfits, 7 pets. Your look is saved in your browser.
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

## Run it

Requires Node.js 18+.

```bash
npm install
npm start
```

Then open http://localhost:3000. To test alone, open several browser windows; a solo game gives you a crewmate with no impostors, so you can try the tasks.

### Playing with friends

Your friends need to reach your server. The options, easiest first:

1. **Deploy for free on Render** (recommended). Push this repo to GitHub, then on [render.com](https://render.com) choose *New → Blueprint* and pick the repo. The included `render.yaml` sets everything up. Share the URL you get.
   - Other Node hosts that support WebSockets (Railway, Fly.io, Glitch, a VPS) also work: run `npm install` and `npm start`, and the server listens on `$PORT`.
2. **Same Wi-Fi / LAN:** run `npm start` and have friends open `http://<your-local-ip>:3000`.
3. **Tunnel from your PC:** run `npm start`, then something like `npx localtunnel --port 3000` or `cloudflared tunnel --url http://localhost:3000`, and share the public link.

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
server/index.js     Express + Socket.IO entry point
server/room.js      Authoritative game logic (lobby, roles, kills, meetings, sabotage, win checks)
shared/constants.js Colors, cosmetics, roles, settings schema (used by server + browser)
shared/map.js       Map geometry, vents, stations, tasks, collision / line-of-sight helpers
public/js/draw.js   Character, cosmetics and pet rendering
public/js/world.js  Map pre-render and field-of-view
public/js/game.js   Client engine: movement, rendering, interactions, HUD, map, cameras
public/js/tasks.js  Task minigames and sabotage repair panels
public/js/ui.js     Menus, wardrobe, settings, admin panel, chat, meetings, overlays
public/js/main.js   Socket wiring and bootstrap
```
