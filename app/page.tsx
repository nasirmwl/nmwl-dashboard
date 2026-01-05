import DailyFocusSection from './components/DailyFocusSection';
import Header from './components/Header';
import JiraTasksSection from './components/JiraTasksSection';
import NotesSection from './components/NotesSection';
import PodcastsSection from './components/PodcastsSection';
import PromisesSection from './components/PromisesSection';
import ProtectedPage from './components/ProtectedPage';
import WeatherSection from './components/WeatherSection';
import YoutubeLinksSection from './components/YoutubeLinksSection';

export default function Home() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-8">
            {/* Notes and Promises Side by Side on Desktop */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PromisesSection />
                <NotesSection />
              </div>
            </section>

            {/* Daily Focus Section (Imp Events) */}
            <section>
              <DailyFocusSection />
            </section>

            {/* Podcasts and YouTube Links Side by Side on Desktop */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PodcastsSection />
                <YoutubeLinksSection />
              </div>
            </section>

            {/* Weather Section */}
            <section>
              <WeatherSection />
            </section>

            {/* Jira Tasks Section - Bottom */}
            <section>
              <JiraTasksSection />
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
