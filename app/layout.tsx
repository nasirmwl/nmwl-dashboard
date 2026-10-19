import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ParticleBackground from "./components/ParticleBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nmwl-dashboard",
  description: "optimal, performance-driven dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <head>
      <link rel="icon" href="/favicon-32x32.png"  sizes="32x32"/>
    </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative font-mono antialiased`}
      >
        <div className="relative z-10 min-h-screen">
          <ParticleBackground />
          {children}
        </div>
      </body>
    </html>
  );
}
