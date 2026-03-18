import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyOrbit | Personal Study Organization",
  description: "A personal student organization website for planning, notes, resources, deadlines, and focus execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
