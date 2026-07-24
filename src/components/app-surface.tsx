"use client";

import type { ReactNode } from "react";

type AppSurfaceProps = {
  children: ReactNode;
};

export function AppSurface({ children }: AppSurfaceProps) {
  return (
    <main className="relative min-h-screen px-4 py-5 text-[#F1EFFF] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="relative z-10">{children}</div>
      </div>
    </main>
  );
}
