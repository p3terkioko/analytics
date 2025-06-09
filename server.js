// server.js
require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const authRouter     = require('./routes/auth');
const playlistRouter = require('./routes/playlist');

const app = express();

// JSON body parsing
app.use(express.json());

// Session middleware with a required secret
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('❌ Error: SESSION_SECRET is not set in your .env');
  process.exit(1);
}
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // set secure:true if you're on HTTPS
}));

// Mount routers
app.use('/auth', authRouter);
app.use('/playlist', playlistRouter);

// Health check
app.get('/', (req, res) => res.send('🎵 KamiLimu.in.the.Ears Backend Up!'));

// Start server
const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
