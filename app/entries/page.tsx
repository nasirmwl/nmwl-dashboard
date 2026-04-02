import Link from "next/link";

import DailyChecksEntriesList from "../components/DailyChecksEntriesList";
import ProtectedPage from "../components/ProtectedPage";

export default function EntriesPage() {
  return (
    <ProtectedPage>
      <div className="crt-screen min-h-screen">
        <main className="mx-auto w-full max-w-[700px] px-4 py-6 sm:py-8">
          <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 mb-4 text-sm crt-text-plain">
            <Link
              href="/"
              className="font-medium text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
            >
              Summary
            </Link>
            <Link
              href="/daily-checks"
              className="font-medium text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
            >
              Daily checks
            </Link>
          </nav>

          <header className="mb-6">
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-crt-phosphor-bright crt-text-plain">
              Saved entries
            </h1>
            <p className="text-sm text-crt-muted crt-text-plain mt-2 leading-relaxed">
              Newest first. Open a row to see what was checked; links go to the editor for that date.
            </p>
          </header>

          <DailyChecksEntriesList />
        </main>
      </div>
    </ProtectedPage>
  );
}
