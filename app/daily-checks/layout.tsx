import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "nmwl — daily checks",
};

export default function DailyChecksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
