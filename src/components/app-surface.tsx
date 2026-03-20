import type { ReactNode } from "react";
import { CursorGlow } from "./cursor-glow";

type AppSurfaceProps = {
  children: ReactNode;
};

export function AppSurface({ children }: AppSurfaceProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8">
      <CursorGlow />
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />
      <div className="bg-beam beam-a" />
      <div className="bg-beam beam-b" />
      <div className="surface-mesh" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/40 to-transparent mix-blend-overlay" />
      <div className="relative z-10 animate-[fade-up_0.5s_ease]">{children}</div>
    </main>
  );
}
