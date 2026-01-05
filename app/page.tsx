import DailyFocusSection from './components/DailyFocusSection';
import JiraTasksSection from './components/JiraTasksSection';
import NotesSection from './components/NotesSection';
import PromisesSection from './components/PromisesSection';
import WeatherSection from './components/WeatherSection';
import Header from './components/Header';
import ProtectedPage from './components/ProtectedPage';

export default function Home() {
  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-8">
            {/* Weather Section - Top */}
            <section>
              <WeatherSection />
            </section>

            {/* Notes Section - Middle */}
            <section>
              <NotesSection />
            </section>

            {/* Daily Focus Section */}
            <section>
              <DailyFocusSection />
            </section>

            {/* Promises Section */}
            <section>
              <PromisesSection />
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
