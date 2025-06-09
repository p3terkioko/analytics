// routes/playlist.js
const express = require('express');
const axios   = require('axios');
const router  = express.Router();

// Count how many times each item appears in an array
function countOccurrences(arr) {
  const map = new Map();
  for (const item of arr) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}

// Return a sorted array of top N { name, count }
function getTopCounts(list, topN = 10) {
  return Array.from(countOccurrences(list).entries())
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, topN)
    .map(([name, count]) => ({ id: name, count }));
}

router.get('/:id/analyze', async (req, res) => {
  const playlistId = req.params.id;
  const token      = req.session?.accessToken;

  if (!token) {
    return res
      .status(401)
      .json({ error: { status: 401, message: 'Not authenticated. Visit /auth/login first.' } });
  }

  try {
    // 1) Fetch all playlist tracks (paginated)
    const tracks = [];
    let offset = 0, total = null;
    do {
      const { data } = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params:  { offset, limit: 100 }
        }
      );
      tracks.push(...data.items);
      total  = data.total;
      offset += data.items.length;
    } while (offset < total);

    // 2) Build flat arrays for counting
    const artistIds = new Set();
    const artists   = [];
    const genres    = [];
    const users     = [];

    tracks.forEach(item => {
      users.push(item.added_by?.id || 'unknown');
      item.track.artists.forEach(a => {
        artists.push(a.name);
        artistIds.add(a.id);
      });
    });

    // 3) Fetch artist metadata in batches → genres
    const idsArr = Array.from(artistIds);
    for (let i = 0; i < idsArr.length; i += 50) {
      const batch = idsArr.slice(i, i + 50).join(',');
      const { data } = await axios.get(
        `https://api.spotify.com/v1/artists?ids=${batch}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      data.artists.forEach(a => a.genres.forEach(g => genres.push(g)));
    }

    // 4) Compute top artists & genres
    const topArtists = Array
      .from(countOccurrences(artists).entries())
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topGenres = Array
      .from(countOccurrences(genres).entries())
      .sort(([,a],[,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // 5) Compute top user IDs
    const topUserIDs = getTopCounts(users, 10); 
    // topUserIDs: [{ id: 'userid1', count: 23 }, ...]

    // 6) Resolve each user’s display_name
    const topUsers = await Promise.all(
      topUserIDs.map(async u => {
        try {
          const { data: profile } = await axios.get(
            `https://api.spotify.com/v1/users/${u.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return {
            id: u.id,
            displayName: profile.display_name || profile.id,
            count: u.count
          };
        } catch {
          // In case of error (e.g. profile not found), fall back to ID
          return {
            id: u.id,
            displayName: u.id,
            count: u.count
          };
        }
      })
    );

    // 7) Return everything together
    return res.json({
      topArtists,
      topGenres,
      topUsers
    });

  } catch (err) {
    const spotifyErr = err.response?.data?.error;
    if (spotifyErr) {
      return res
        .status(spotifyErr.status)
        .json({ error: { status: spotifyErr.status, message: spotifyErr.message } });
    }
    console.error(err);
    return res
      .status(500)
      .json({ error: { status: 500, message: 'Internal server error' } });
  }
});

module.exports = router;
