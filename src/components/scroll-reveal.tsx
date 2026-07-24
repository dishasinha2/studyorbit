"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 24,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: isInView ? "translateY(0)" : `translateY(${yOffset}px)`,
        opacity: isInView ? 1 : 0,
        transition: `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
