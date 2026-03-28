'use client';

import DailyFocusSection from './components/DailyFocusSection';
import NotesSection from './components/NotesSection';
import PodcastsSection from './components/PodcastsSection';
import ProtectedPage from './components/ProtectedPage';
import WeatherSection from './components/WeatherSection';
import { useGlobalToggleShortcut } from './hooks/useSectionToggle';

export default function Home() {
  useGlobalToggleShortcut();

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <main className="container mx-auto px-4 sm:px-4 py-6 sm:py-8 max-w-7xl">
          <div className="space-y-6 sm:space-y-8">
            {/* Weather at top */}
            <section>
              <WeatherSection />
            </section>

            {/* Notes – raw capture */}
            <section>
              <NotesSection />
            </section>

            <section>
              <PodcastsSection />
            </section>

            <section>
              <DailyFocusSection />
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
