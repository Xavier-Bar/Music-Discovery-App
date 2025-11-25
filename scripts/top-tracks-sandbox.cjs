#!/usr/bin/env node
// Simple sandbox to call fetchUserTopTracks and log the first track
const [,, tokenArg, limitArg = '10', timeRangeArg = 'short_term'] = process.argv;

const token = tokenArg || process.env.SPOTIFY_TOKEN;

(async () => {
  if (!token) {
    console.error('Usage: node scripts/top-tracks-sandbox.cjs <token> [limit] [time_range]');
    console.error('Or set SPOTIFY_TOKEN env var');
    process.exit(1);
  }

  try {
    // dynamically import the ESM module from CJS
    const mod = await import('../src/api/spotify-me.js');
    const fetchUserTopTracks = mod.fetchUserTopTracks;

    const limit = Number(limitArg) || 10;
    const timeRange = timeRangeArg;

    console.log('Fetching top tracks...');
    const res = await fetchUserTopTracks(token, limit, timeRange);

    if (res.error) {
      console.error('API error:', res.error);
      process.exit(1);
    }

    const data = res.data;
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      console.log('No top tracks returned.');
      return;
    }

    console.log('First track object (topTracks.items[0]):');
    console.log(JSON.stringify(data.items[0], null, 2));
  } catch (err) {
    console.error('Failed to fetch top tracks:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
