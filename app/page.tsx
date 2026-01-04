import WeatherSection from './components/WeatherSection';
import NotesSection from './components/NotesSection';
import JiraTasksSection from './components/JiraTasksSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
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

          {/* Jira Tasks Section - Bottom */}
          <section>
            <JiraTasksSection />
          </section>
        </div>
      </main>
    </div>
  );
}
