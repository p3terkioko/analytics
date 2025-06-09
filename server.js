// server.js
require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const path           = require('path');
const authRouter     = require('./routes/auth');
const playlistRouter = require('./routes/playlist');

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// JSON parsing & sessions
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// API routes
app.use('/auth', authRouter);
app.use('/playlist', playlistRouter);

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
const PORT = process.env.PORT || 8888;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
