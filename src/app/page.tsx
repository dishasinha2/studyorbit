import { PenSquare, FileStack, Timer } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AnimatedHero } from "@/components/animated-hero";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TiltCard } from "@/components/tilt-card";

export default function Home() {
  return (
    <AppSurface>
      <section className="mx-auto max-w-6xl space-y-8">
        <ScrollReveal yOffset={-20} duration={0.6}>
          <SiteNav active="intro" />
        </ScrollReveal>

        <AnimatedHero />

        <ScrollReveal delay={0.2} yOffset={30}>
          <section className="grid gap-4 md:grid-cols-3">
            <TiltCard className="feature-card hover-lift">
              <span className="icon-badge mb-3">
                <PenSquare className="h-4 w-4" />
              </span>
              <h2>Notes</h2>
              <p>Write, highlight, and review.</p>
            </TiltCard>
            <TiltCard className="feature-card hover-lift">
              <span className="icon-badge mb-3">
                <FileStack className="h-4 w-4" />
              </span>
              <h2>Files</h2>
              <p>Store material with progress notes.</p>
            </TiltCard>
            <TiltCard className="feature-card hover-lift">
              <span className="icon-badge mb-3">
                <Timer className="h-4 w-4" />
              </span>
              <h2>Focus</h2>
              <p>Start study blocks and breaks quickly.</p>
            </TiltCard>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <SiteFooter />
        </ScrollReveal>
      </section>
    </AppSurface>
  );
}
