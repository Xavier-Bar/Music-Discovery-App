#!/usr/bin/env node
const { generateAccessToken } = require("./utils.cjs");

/**
 * Simple CLI wrapper to call artistCountForPlaylist (ESM) from CJS via dynamic import
 * Usage: node scripts/artist-count-sandbox.cjs <playlistId> [token]
 */
async function main() {
  const args = process.argv.slice(2);
  const playlistId = args[0];
  let token = args[1];
  // optional third argument: top N
  const topNArg = args[2];
  const topN = topNArg ? Math.max(1, parseInt(topNArg, 10) || 5) : 5;

  if (!playlistId) {
    console.error('Usage: node scripts/artist-count-sandbox.cjs <playlistId> [token]');
    process.exit(1);
  }

  try {
    if (!token) {
      token = await generateAccessToken();
    }

    // dynamically import the ESM module
    const { artistCountForPlaylist } = await import("../src/services/artist-count-for-playlist.js");

    const data = await artistCountForPlaylist(token, playlistId);

    if (!data || Object.keys(data).length === 0) {
      console.log('No artist data found in playlist.');
      return;
    }

    // prepare Top N sorted by count desc
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, topN);
    const rows = top.map(([artist, count]) => ({ Artist: artist, 'Number of Tracks': count }));
    console.log(`Top ${topN} Artists for playlist ${playlistId}:`);
    console.table(rows);
  } catch (err) {
    console.error('Unexpected error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
