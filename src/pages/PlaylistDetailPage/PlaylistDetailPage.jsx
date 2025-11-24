import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import './PlaylistDetailPage.css';

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useRequireToken();

    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // update title while loading
        document.title = buildTitle('Playlist');
    }, []);

    useEffect(() => {
        if (!token) return;
        fetchPlaylistById(token, id)
            .then(res => {
                if (res.error) {
                    if (!handleTokenError(res.error, navigate)) {
                        setError(res.error);
                    }
                    return;
                }
                setPlaylist(res.data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [token, id, navigate]);

    useEffect(() => {
        if (playlist?.name) {
            document.title = buildTitle(playlist.name);
        }
    }, [playlist]);

    return (
        <section className="playlist-detail page-container" data-testid="playlist-detail-page">
            {loading && <output data-testid="loading-indicator">Loading playlist…</output>}
            {error && !loading && <div role="alert" className="playlist-error">{error}</div>}

            {!loading && !error && playlist && (
                <div>
                    <header className="playlist-header">
                        {playlist.images?.[0]?.url && (
                            <div className="playlist-cover-wrapper">
                                <img
                                    src={playlist.images[0].url}
                                    alt={`Cover for ${playlist.name}`}
                                    className="playlist-cover"
                                />
                            </div>
                        )}

                        <div className="playlist-header-content">
                            <div className="playlist-header-text-with-link">
                                <div className="playlist-header-text">
                                    <h1 className="playlist-title">{playlist.name}</h1>
                                    {playlist.description && <p className="playlist-subtitle">{playlist.description}</p>}
                                </div>

                                {playlist.external_urls?.spotify && (
                                    <a
                                        href={playlist.external_urls.spotify}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="playlist-spotify-link"
                                    >
                                        Open in Spotify
                                    </a>
                                )}
                            </div>
                        </div>
                    </header>

                    <ol className="tracks-list playlist-tracks">
                        {playlist.tracks?.items
                            .filter(item => item && item.track)
                            .map(item => (
                                <TrackItem key={item.track.id} track={item.track} />
                            ))}
                    </ol>
                </div>
            )}
        </section>
    );
}