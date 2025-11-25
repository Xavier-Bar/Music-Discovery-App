import { useState, useEffect } from 'react';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchUserTopArtists } from '../../api/spotify-me.js';

export default function DashboardPage() {
  const { token, checking } = useRequireToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topArtist, setTopArtist] = useState(null);

  // set loading when token becomes available
  useEffect(() => {
    if (!checking && token) setLoading(true);
  }, [checking, token]);

  useEffect(() => {
    if (checking) return; // wait for token check to finish
    if (!token) return; // useRequireToken will redirect to login

    let active = true;
    setError(null);
    fetchUserTopArtists(token, 1, 'short_term')
      .then(res => {
        if (!active) return;
        if (res.error) {
          setError(res.error);
          return;
        }
        setTopArtist(res.data?.items?.[0] ?? null);
      })
      .catch(err => {
        if (!active) return;
        setError(err?.message ?? String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, checking]);

  return (
    <section className="dashboard page-container" data-testid="dashboard-page">
      <h1 className="page-title">Dashboard</h1>

      {checking && <div className="dashboard-status">Checking authentication…</div>}
      {loading && <div className="dashboard-status" role="status">Loading top artist…</div>}
      {error && !loading && <div role="alert" className="dashboard-error">{error}</div>}

      {!loading && !error && topArtist && (
        <div className="dashboard-top-artist" data-testid="top-artist">
          <img
            src={topArtist.images?.[0]?.url}
            alt={topArtist.name}
            className="top-artist-cover"
          />
          <div className="top-artist-info">
            <div className="top-artist-name">{topArtist.name}</div>
            {Array.isArray(topArtist.genres) && topArtist.genres.length > 0 && (
              <div className="top-artist-genres">{topArtist.genres.join(', ')}</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
