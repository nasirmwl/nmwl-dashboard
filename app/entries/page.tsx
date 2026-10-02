import Link from "next/link";
import { Home } from "lucide-react";

import DailyChecksEntriesList from "../components/DailyChecksEntriesList";
import ProtectedPage from "../components/ProtectedPage";

export default function EntriesPage() {
  return (
    <ProtectedPage>
      <div className="crt-screen min-h-screen">
        <main className="mx-auto w-full max-w-[700px] px-4 py-6 sm:py-8">
          <nav className="mb-4 flex items-center justify-between gap-3 text-sm crt-text-plain">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex size-8 items-center justify-center rounded-sm border border-crt-border text-crt-phosphor transition-colors hover:border-crt-phosphor-dim hover:text-crt-phosphor-bright"
            >
              <Home className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
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
            </div>
          </nav>

          <header className="mb-6">
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-crt-phosphor-bright crt-text-plain">
              Saved entries
            </h1>
            <p className="text-sm text-crt-muted crt-text-plain mt-2 leading-relaxed">
              Newest first. Open a row to see what was checked, or use Edit to change that day.
            </p>
          </header>

          <DailyChecksEntriesList />
        </main>
      </div>
    </ProtectedPage>
  );
}
