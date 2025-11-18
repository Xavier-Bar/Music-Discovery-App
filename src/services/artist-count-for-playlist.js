import { fetchPlaylistById } from '../api/spotify-playlists.js';

/**
 * Count how many times each artist appears in a Spotify playlist.
 * @param {string} token - Spotify access token
 * @param {string} playlistId - Spotify playlist id
 * @returns {Promise<Record<string, number> | undefined>} - counts by artist name, or undefined on error
 */
export async function artistCountForPlaylist(token, playlistId) {
  try {
    const { data, error } = await fetchPlaylistById(token, playlistId);
    if (error) {
      console.error('Error fetching playlist:', error);
      return undefined;
    }

    if (!data || !data.tracks || !Array.isArray(data.tracks.items)) {
      return {};
    }

    const counts = {};
    for (const item of data.tracks.items) {
      // each item should have a `track` object
      const track = item && item.track ? item.track : null;
      if (!track) continue;

      const artists = Array.isArray(track.artists) ? track.artists : [];
      for (const artist of artists) {
        const name = artist && (artist.name || artist.id) ? (artist.name || artist.id) : 'Unknown Artist';
        counts[name] = (counts[name] || 0) + 1;
      }
    }

    return counts;
  } catch (err) {
    console.error('Error fetching playlist:', err);
    return undefined;
  }
}

export default artistCountForPlaylist;