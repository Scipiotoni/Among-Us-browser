// Builds the static site for GitHub Pages into ./_site (no server needed: see public/js/net.js).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, '_site');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });
fs.cpSync(path.join(root, 'shared'), path.join(out, 'shared'), { recursive: true });
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Built _site');
