'use client';

import DailyFocusSection from './components/DailyFocusSection';
import MeSection from './components/MeSection';
import NotesSection from './components/NotesSection';
// import PodcastsSection from './components/PodcastsSection';
import ProtectedPage from './components/ProtectedPage';
// import WeatherSection from './components/WeatherSection';
import { useGlobalToggleShortcut } from './hooks/useSectionToggle';

export default function Home() {
  useGlobalToggleShortcut();

  return (
    <ProtectedPage>
      <div className="crt-screen min-h-screen">
        <main className="mx-auto w-full max-w-[700px] px-4 sm:px-4 py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            <section>
              <MeSection />
            </section>

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
