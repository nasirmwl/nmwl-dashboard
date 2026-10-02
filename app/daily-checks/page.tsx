import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import DailyChecksEntryGate from "../components/DailyChecksEntryGate";
import ProtectedPage from "../components/ProtectedPage";

function DailyChecksFallback() {
  return (
    <div className="crt-panel rounded-sm p-6" aria-busy="true">
      <div className="animate-pulse h-40 rounded-sm bg-crt-bar-track/40 border border-crt-border" />
    </div>
  );
}

export default function DailyChecksPage() {
  return (
    <ProtectedPage>
      <div className="crt-screen min-h-screen">
        <main className="mx-auto w-full max-w-[700px] px-4 py-6 sm:py-8">
          <nav className="mb-4">
            <Link
              href="/"
              aria-label="Back to summary"
              className="inline-flex size-8 items-center justify-center rounded-sm border border-crt-border text-crt-phosphor transition-colors hover:border-crt-phosphor-dim hover:text-crt-phosphor-bright"
            >
              <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </nav>
          <Suspense fallback={<DailyChecksFallback />}>
            <DailyChecksEntryGate />
          </Suspense>
        </main>
      </div>
    </ProtectedPage>
  );
}
