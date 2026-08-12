import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
import "./app-theme.css";

export const metadata: Metadata = {
  title: "StudyOrbit | AI Career Guidance Platform",
  description:
    "An AI-powered career guidance workspace for profiles, documents, roadmaps, skills, reminders, and progress tracking.",
  keywords: ["career", "AI guidance", "resume", "roadmap", "skills", "interview preparation"],
  manifest: "/manifest.webmanifest",
  applicationName: "StudyOrbit",
  appleWebApp: {
    capable: true,
    title: "StudyOrbit",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "StudyOrbit",
    description: "AI-powered career guidance, documents, roadmaps, reminders, and progress tracking.",
    siteName: "StudyOrbit",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0891b2" />
      </head>
      <body className="antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
