'use client';

import Link from 'next/link';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import DailyFocusSection from './components/DailyFocusSection';
import GrowthStatsPanel from './components/GrowthStatsPanel';
import NotesSection from './components/NotesSection';
// import PodcastsSection from './components/PodcastsSection';
import ProtectedPage from './components/ProtectedPage';
// import WeatherSection from './components/WeatherSection';
import { useGlobalToggleShortcut } from './hooks/useSectionToggle';

/** Hide the ME / first panel on hosts whose hostname includes this (e.g. notemwl.vercel.app). */
const HIDE_FIRST_BOX_HOST = 'notemwl';

export default function Home() {
  useGlobalToggleShortcut();
  const [showFirstBox, setShowFirstBox] = useState(true);
  const [showTopVisuals, setShowTopVisuals] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch('/auth/logout', { method: 'POST' });
      if (!response.ok) {
        setLoggingOut(false);
        return;
      }
      window.location.href = '/login';
    } catch {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    if (host.includes(HIDE_FIRST_BOX_HOST)) {
      setShowFirstBox(false);
    }
  }, []);

  return (
    <ProtectedPage>
      <div className="crt-screen min-h-screen">
        <main className="mx-auto w-full max-w-[700px] px-4 sm:px-4 py-6 sm:py-8">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm crt-text-plain">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={showTopVisuals}
                aria-label={showTopVisuals ? 'Hide charts, image, and friction points' : 'Show charts, image, and friction points'}
                onClick={() => setShowTopVisuals((open) => !open)}
                className="inline-flex size-8 items-center justify-center rounded-sm border border-crt-border text-crt-phosphor transition-colors hover:border-crt-phosphor-dim hover:text-crt-phosphor-bright"
              >
                {showTopVisuals ? (
                  <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <EyeOff className="size-4" strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Logout"
                disabled={loggingOut}
                onClick={handleLogout}
                className="inline-flex size-8 items-center justify-center rounded-sm border border-crt-border text-crt-danger transition-colors hover:border-crt-danger hover:text-crt-danger disabled:opacity-50"
              >
                <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-x-4">
              <Link
                href="/entries"
                className="font-medium text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
              >
                Entries
              </Link>
              <Link
                href="/daily-checks"
                className="font-medium text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
              >
                Daily checks
              </Link>
            </div>
          </div>
          <div className="space-y-6 sm:space-y-8">
            {showFirstBox && (
              <section>
                <GrowthStatsPanel showTopVisuals={showTopVisuals} />
              </section>
            )}

            {/* <section>
              <WeatherSection />
            </section> */}

            {/* Notes – raw capture */}
            <section>
              <NotesSection />
            </section>

            {/* <section>
              <PodcastsSection />
            </section> */}

            <section>
              <DailyFocusSection />
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
