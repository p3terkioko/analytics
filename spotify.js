// spotify.js
const axios = require('axios');
require('dotenv').config();

const clientId     = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken     = null;
let tokenExpiration = 0;

// Get app-level token (Client Credentials Flow)
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiration) {
    return accessToken;
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  accessToken     = resp.data.access_token;
  tokenExpiration = now + resp.data.expires_in * 1000 - 5000;
  return accessToken;
}

module.exports = { getAccessToken };
