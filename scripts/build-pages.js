// Builds a static copy of the game client for GitHub Pages into ./_site.
// The page connects to the game server at SERVER_URL (the Render deployment by default).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, '_site');
const serverUrl = process.env.SERVER_URL || 'https://sus-station.onrender.com';

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });
fs.cpSync(path.join(root, 'shared'), path.join(out, 'shared'), { recursive: true });
fs.mkdirSync(path.join(out, 'socket.io'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js'),
  path.join(out, 'socket.io', 'socket.io.js'),
);
fs.writeFileSync(path.join(out, 'js', 'config.js'), `window.SERVER_URL = ${JSON.stringify(serverUrl)};\n`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Built _site (server: ${serverUrl})`);
