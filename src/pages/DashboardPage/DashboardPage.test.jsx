// src/pages/DashboardPage/DashboardPage.test.jsx

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './DashboardPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import { beforeEach, afterEach, jest } from '@jest/globals';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';

// Mock top artist and track data
const topArtistData = {
    items: [
        { 
            id: 'artist1', 
            name: 'Top Artist', 
            genres: ['pop', 'rock'],
            images: [{ url: 'https://via.placeholder.com/64' }], 
            external_urls: { spotify: 'https://open.spotify.com/artist/artist1' } 
        },
    ],
};

const topTrackData = {
    items: [
        { 
            id: 'track1', 
            name: 'Top Track', 
            album: { images: [{ url: 'https://via.placeholder.com/64' }], 
            name: 'Top Album' }, 
            artists: [{ name: 'Artist1' }], 
            external_urls: { spotify: 'https://open.spotify.com/track/track1' } },
    ],
};

// Mock token value
const tokenValue = 'test-token';

// Tests for DashboardPage
describe('DashboardPage', () => {
    // Setup mocks before each test
    beforeEach(() => {
        // Mock localStorage token access
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => key === KEY_ACCESS_TOKEN ? tokenValue : null);

        // Default mock: successful top artist and track fetch
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: topArtistData, error: null });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: topTrackData, error: null });
    });

    // Restore mocks after each test
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper to render DashboardPage
    const renderDashboardPage = () => {
        return render(
            // render DashboardPage within MemoryRouter
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* Dummy login route for redirection when token is expired */}
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    // Helper to wait for loading to finish
    const waitForLoadingToFinish = async () => {
        // Wait for loading status to appear then disappear
        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    };

    test('renders dashboard page', async () => {
        // Render the DashboardPage
        renderDashboardPage();

        // wait for loading to finish
        await waitForLoadingToFinish();

        // when loading is done, verify top artist and track content rendered

        // should render main title
        const heading = screen.getByRole('heading', { level: 1, name: /dashboard/i });
        expect(heading).toBeInTheDocument();

        // should render top artist card (SimpleCard renders h3 for title)
        const artistCard = await screen.findByText(topArtistData.items[0].name);
        expect(artistCard).toBeInTheDocument();
        expect(artistCard.tagName).toBe('H3');

        // should render top track card
        const trackCard = screen.getByText(topTrackData.items[0].name);
        expect(trackCard).toBeInTheDocument();
        expect(trackCard.tagName).toBe('H3');

        // should render artist genres as subtitle
        expect(screen.getByText('pop, rock')).toBeInTheDocument();

        // should render track artists as subtitle
        expect(screen.getByText('Artist1')).toBeInTheDocument();

        // verify API calls were made with correct params
        expect(spotifyApi.fetchUserTopArtists).toHaveBeenCalledWith(tokenValue, 1, 'short_term');
        expect(spotifyApi.fetchUserTopTracks).toHaveBeenCalledWith(tokenValue, 1, 'short_term');
    });

    test('displays error message on fetch failure', async () => {
        // Mock fetchUserTopArtists to return error (first error wins)
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: null, error: 'Failed to fetch top artists' });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: topTrackData, error: null });

        // Render the DashboardPage
        renderDashboardPage();

        // should display error message (component shows first error encountered)
        const errorAlert = await screen.findByRole('alert');
        expect(errorAlert).toHaveTextContent('Failed to fetch top artists');

        // cards should not be rendered
        expect(screen.queryByText(topArtistData.items[0].name)).not.toBeInTheDocument();
        expect(screen.queryByText(topTrackData.items[0].name)).not.toBeInTheDocument();
    });

    test('displays error message on fetch exception', async () => {
        // Mock Promise.all to reject with network error
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockRejectedValue(new Error('Network error'));
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: topTrackData, error: null });

        // Render the DashboardPage
        renderDashboardPage();

        // should display error message from catch block
        const errorAlert = await screen.findByRole('alert');
        expect(errorAlert).toHaveTextContent('Network error');
    });

    test('displays error when token expires (no redirect in current impl)', async () => {
        // Mock fetchUserTopArtists to return token expired error
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: null, error: 'The access token expired' });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: topTrackData, error: null });

        // Render the DashboardPage
        renderDashboardPage();

        // Should display error (DashboardPage doesn't use handleTokenError yet)
        const errorAlert = await screen.findByRole('alert');
        expect(errorAlert).toHaveTextContent('The access token expired');
    });

    test('renders empty state when no artist or track data', async () => {
        // Mock empty responses
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: { items: [] }, error: null });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: { items: [] }, error: null });

        renderDashboardPage();
        await waitForLoadingToFinish();

        // Title should still render
        expect(screen.getByRole('heading', { level: 1, name: /dashboard/i })).toBeInTheDocument();

        // No cards should be rendered
        expect(screen.queryByText(topArtistData.items[0].name)).not.toBeInTheDocument();
        expect(screen.queryByText(topTrackData.items[0].name)).not.toBeInTheDocument();
    });

    test('displays checking authentication message when checking', () => {
        // Mock localStorage to return no token, triggering checking state
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => null);

        renderDashboardPage();

        // Should display checking message
        expect(screen.getByText('Checking authentication…')).toBeInTheDocument();

        // Should not display loading or error
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('renders only artist card when track data is missing', async () => {
        // Mock: artist has data, track is empty
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: topArtistData, error: null });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: { items: [] }, error: null });

        renderDashboardPage();
        await waitForLoadingToFinish();

        // Artist card should render
        const artistCard = await screen.findByText(topArtistData.items[0].name);
        expect(artistCard).toBeInTheDocument();

        // Track card should not render
        expect(screen.queryByText(topTrackData.items[0].name)).not.toBeInTheDocument();
    });

    test('renders only track card when artist data is missing', async () => {
        // Mock: track has data, artist is empty
        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ data: { items: [] }, error: null });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: topTrackData, error: null });

        renderDashboardPage();
        await waitForLoadingToFinish();

        // Track card should render
        const trackCard = await screen.findByText(topTrackData.items[0].name);
        expect(trackCard).toBeInTheDocument();

        // Artist card should not render
        expect(screen.queryByText(topArtistData.items[0].name)).not.toBeInTheDocument();
    });

    test('handles missing images gracefully', async () => {
        // Mock data without images
        const artistNoImage = { ...topArtistData.items[0], images: [] };
        const trackNoImage = { ...topTrackData.items[0], album: { ...topTrackData.items[0].album, images: [] } };

        jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({ 
            data: { items: [artistNoImage] }, 
            error: null 
        });
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ 
            data: { items: [trackNoImage] }, 
            error: null 
        });

        renderDashboardPage();
        await waitForLoadingToFinish();

        // Cards should still render with titles (use findBy to wait for async render)
        expect(await screen.findByText(artistNoImage.name)).toBeInTheDocument();
        expect(screen.getByText(trackNoImage.name)).toBeInTheDocument();
    });
});