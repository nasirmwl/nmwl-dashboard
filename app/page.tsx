'use client';

import Link from 'next/link';
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
          <div className="flex justify-end gap-x-4 mb-2 text-sm crt-text-plain">
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
          <div className="space-y-6 sm:space-y-8">
            {showFirstBox && (
              <section>
                <GrowthStatsPanel />
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
