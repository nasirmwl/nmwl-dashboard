"use client";

import { useSearchParams } from "next/navigation";
import DailyChecksEntry from "./DailyChecksEntry";

export default function DailyChecksEntryGate() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("date");
  const initialDate = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  return <DailyChecksEntry initialDate={initialDate} />;
}
