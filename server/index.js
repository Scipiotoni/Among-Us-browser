// Local static server for development. The game itself needs no server: multiplayer goes through a
// public MQTT broker and the lobby host's browser runs the game (see public/js/net.js).
const path = require('path');
const express = require('express');

const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));
app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Browser Imposter running on http://localhost:${PORT}`));
