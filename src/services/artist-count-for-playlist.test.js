// src/services/artist-count-for-playlist.test.js
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { artistCountForPlaylist } from "./artist-count-for-playlist.js";

// Mock the API module that artistCountForPlaylist depends on
jest.mock("../api/spotify-playlists.js", () => ({
  fetchPlaylistById: jest.fn(),
}));

import { fetchPlaylistById } from "../api/spotify-playlists.js";

// Helper to build playlist shape
function makePlaylist(trackItems) {
  return {
    tracks: {
      items: trackItems.map((t) => ({
        track: {
          name: t.name,
          artists: (t.artists || []).map((a) => ({ name: a })),
        },
      })),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("artistCountForPlaylist", () => {
  test("calls fetchPlaylistById with token and playlistId", async () => {
    const token = "token123";
    const playlistId = "playlistABC";
    fetchPlaylistById.mockResolvedValue({
      data: makePlaylist([
        { name: "Song 1", artists: ["Artist A"] },
        { name: "Song 2", artists: ["Artist B"] },
        { name: "Song 3", artists: ["Artist C", "Artist A"] },
      ]),
      error: null,
    });

    const result = await artistCountForPlaylist(token, playlistId);

    expect(fetchPlaylistById).toHaveBeenCalledTimes(1);
    expect(fetchPlaylistById).toHaveBeenCalledWith(token, playlistId);
    expect(result).toEqual({ "Artist A": 2, "Artist B": 1, "Artist C": 1 });
  });

  test("returns undefined and logs error when fetchPlaylistById rejects", async () => {
    const mockError = new Error("Network failure");
    fetchPlaylistById.mockRejectedValue(mockError);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await artistCountForPlaylist("t", "p");
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    // First arg string, second the error object (implementation logs both)
    const callArgs = consoleSpy.mock.calls[0];
    expect(callArgs[0]).toMatch(/Error fetching playlist/);
    expect(callArgs[1]).toBe(mockError);

    consoleSpy.mockRestore();
  });

  test("returns undefined and logs error when fetchPlaylistById returns error field", async () => {
    const apiError = 'API rate limit';
    fetchPlaylistById.mockResolvedValue({ data: null, error: apiError });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await artistCountForPlaylist('t', 'p');
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const callArgs = consoleSpy.mock.calls[0];
    expect(callArgs[0]).toMatch(/Error fetching playlist/);
    expect(callArgs[1]).toBe(apiError);

    consoleSpy.mockRestore();
  });

  test("returns empty object when playlist has no tracks.items", async () => {
    fetchPlaylistById.mockResolvedValue({ data: { some: 'value' }, error: null });

    const result = await artistCountForPlaylist('t', 'p');
    expect(result).toEqual({});
  });

  test("counts artists, skips missing track items and falls back to artist.id when name missing", async () => {
    const data = {
      tracks: {
        items: [
          { track: { name: 'Song A', artists: [{ id: 'artist-id-1' }] } },
          { not_track: true },
          { track: { name: 'Song B', artists: [{ name: 'Artist Name' }, { id: 'artist-id-2' }] } },
        ],
      },
    };
    fetchPlaylistById.mockResolvedValue({ data, error: null });

    const result = await artistCountForPlaylist('t', 'p');
    expect(result).toEqual({ 'artist-id-1': 1, 'Artist Name': 1, 'artist-id-2': 1 });
  });
});