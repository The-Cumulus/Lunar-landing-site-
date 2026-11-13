import React, { useState, useEffect, useCallback } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { ExplorerDashboard } from './components/dashboard/ExplorerDashboard';

export function App() {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [view, setView] = useState<'landing' | 'explorer'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash.includes('explorer') ||
        hash.includes('dashboard') ||
        search.includes('explorer') ||
        search.includes('dashboard')
      ) {
        return 'explorer';
      }
    }
    return 'landing';
  });

  // URL Hash and Popstate sync for seamless browser history back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      if (
        hash.includes('explorer') ||
        hash.includes('dashboard') ||
        search.includes('explorer') ||
        search.includes('dashboard')
      ) {
        // Check for specific site param in hash if present (e.g. #/explorer?site=chandrayaan-3)
        const match = window.location.hash.match(/site=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          setSelectedSiteId(match[1]);
        }
        setView('explorer');
      } else {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleLaunchExplorer = useCallback((siteId?: string) => {
    setSelectedSiteId(siteId || null);
    if (siteId) {
      window.location.hash = `/explorer?site=${siteId}`;
    } else {
      window.location.hash = '/explorer';
    }
    setView('explorer');
  }, []);

  const handleBackToLanding = useCallback(() => {
    setSelectedSiteId(null);
    window.location.hash = '';
    setView('landing');
    // Smooth scroll to top of landing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (view === 'explorer') {
    return (
      <ExplorerDashboard
        onBackToLanding={handleBackToLanding}
        initialSiteId={selectedSiteId}
      />
    );
  }

  return <LandingPage onLaunchExplorer={handleLaunchExplorer} />;
}

export default App;
