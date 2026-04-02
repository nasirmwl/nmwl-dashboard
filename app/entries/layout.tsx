import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily check entries",
};

export default function EntriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
