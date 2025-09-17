import { useEffect, useState } from 'react';
import { API } from './lib/api';
import TeamsPage from './pages/admin/Teams.jsx';
import GroupsPage from './pages/admin/Groups.jsx';
import MatchesPage from './pages/admin/Matches.jsx';
import KnockoutPage from './pages/admin/Knockout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const TABS = [
  { id: 'teams', label: 'Teams' },
  { id: 'groups', label: 'Groups' },
  { id: 'matches', label: 'Matches' },
  { id: 'ko', label: 'Knockout' },
];

export default function App() {
  const [tab, setTab] = useState('teams');
  const [health, setHealth] = useState(null);

  // Restore last opened tab
  useEffect(() => {
    const saved = localStorage.getItem('app.activeTab');
    if (saved && TABS.some(t => t.id === saved)) setTab(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('app.activeTab', tab);
  }, [tab]);

  // Ping API health
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await API.health();
        if (alive) setHealth(h);
      } catch {
        if (alive) setHealth({ ok: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  // Optional keyboard nav: Ctrl+ArrowLeft/Right to change tabs
  useEffect(() => {
    const onKey = (e) => {
      if (!e.ctrlKey) return;
      const idx = TABS.findIndex(t => t.id === tab);
      if (e.key === 'ArrowRight') setTab(TABS[(idx + 1) % TABS.length].id);
      if (e.key === 'ArrowLeft') setTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab]);

  const TabButton = ({ id, label }) => (
    <button
      type="button"
      className={`tab ${tab === id ? 'is-active' : ''}`}
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
    >
      {label}
    </button>
  );

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Badminton Tournament Admin</h1>
        <span className="badge">
          API&nbsp;
          {import.meta.env.VITE_API_URL || '(no VITE_API_URL)'}
          &nbsp;–&nbsp;
          {health ? (health.ok ? 'OK' : 'Down') : '...'}
        </span>
      </header>

      <nav className="tabs" aria-label="Primary">
        {TABS.map(t => (
          <TabButton key={t.id} id={t.id} label={t.label} />
        ))}
      </nav>

      <main className="card" style={{ marginTop: 12 }}>
        <div className="card-body">
          {tab === 'teams' && (
            <ErrorBoundary>
              <TeamsPage />
            </ErrorBoundary>
          )}
          {tab === 'groups' && (
            <ErrorBoundary>
              <GroupsPage />
            </ErrorBoundary>
          )}
          {tab === 'matches' && (
            <ErrorBoundary>
              <MatchesPage />
            </ErrorBoundary>
          )}
          {tab === 'ko' && (
            <ErrorBoundary>
              <KnockoutPage />
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}
