// routes/auth.js
const express    = require('express');
const axios      = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const router       = express.Router();
const clientId     = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri  = process.env.REDIRECT_URI;

// 1) Redirect to Spotify for consent
router.get('/login', (req, res) => {
  const scope = [
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');
  const url =
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope,
      redirect_uri: redirectUri
    });
  res.redirect(url);
});

// 2) Handle Spotify callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResp = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Store tokens in session
    req.session.accessToken  = tokenResp.data.access_token;
    req.session.refreshToken = tokenResp.data.refresh_token;

    res.send('✅ Authentication successful. You can now call /playlist/:id/analyze');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
