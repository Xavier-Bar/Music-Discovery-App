import { useState, useEffect } from 'react';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';
import './DashboardPage.css';

export default function DashboardPage() {
  const { token, checking } = useRequireToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topArtist, setTopArtist] = useState(null);
  const [topTrack, setTopTrack] = useState(null);

  // when token becomes available, fetch top artist and top track in parallel
  useEffect(() => {
    if (checking) return;
    if (!token) return;

    let active = true;
    // schedule loading state update to avoid synchronous setState in effect
    Promise.resolve().then(() => {
      if (active) setLoading(true);
      if (active) setError(null);
    });

    const pArtists = fetchUserTopArtists(token, 1, 'short_term');
    const pTracks = fetchUserTopTracks(token, 1, 'short_term');

    Promise.all([pArtists, pTracks])
      .then(([aRes, tRes]) => {
        if (!active) return;
        if (aRes.error || tRes.error) {
          setError(aRes.error || tRes.error);
          return;
        }

        setTopArtist(aRes.data?.items?.[0] ?? null);
        setTopTrack(tRes.data?.items?.[0] ?? null);
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

      {/* cards container (artist + track) rendered below */}
      {(!loading && !error) && (
        <div className="dashboard-cards">
          {topArtist && (
            <SimpleCard
              imageUrl={topArtist.images?.[0]?.url}
              title={topArtist.name}
              subtitle={Array.isArray(topArtist.genres) ? topArtist.genres.join(', ') : ''}
              link={topArtist.external_urls?.spotify}
            />
          )}

          {topTrack && (
            <SimpleCard
              imageUrl={topTrack.album?.images?.[0]?.url}
              title={topTrack.name}
              subtitle={topTrack.artists?.map(a => a.name).join(', ')}
              link={topTrack.external_urls?.spotify}
            />
          )}
        </div>
      )}
    </section>
  );
}
