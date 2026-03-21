"use client";

import { motion } from "framer-motion";

type ThreeDShowcaseProps = {
  className?: string;
  theme?: "violet" | "cyan" | "mixed";
  label?: string;
  title?: string;
  subtitle?: string;
};

export function ThreeDShowcase({
  className = "",
  theme = "mixed",
  label = "StudyOrbit Engine",
  title = "3D workflow surface",
  subtitle = "Depth, motion, and focus cues for every core action.",
}: ThreeDShowcaseProps) {
  return (
    <div className={`three-d-showcase ${className}`}>
      <div className={`three-d-stage three-d-stage-${theme}`}>
        <div className="three-d-noise" />

        <motion.div
          className="three-d-orb orb-main"
          animate={{ y: [0, -16, 0], rotate: [0, 8, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="three-d-orb orb-secondary"
          animate={{ y: [0, 20, 0], x: [0, 12, 0], scale: [1, 0.95, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
        <motion.div
          className="three-d-orb orb-accent"
          animate={{ y: [0, -12, 0], x: [0, -10, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />

        <motion.div
          className="three-d-ribbon ribbon-top"
          animate={{ rotate: [8, 16, 8], x: [0, 10, 0], y: [0, -6, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="three-d-ribbon ribbon-bottom"
          animate={{ rotate: [-10, -2, -10], x: [0, -12, 0], y: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />

        <div className="three-d-hud hud-top">
          <span className="three-d-dot" />
          <span className="three-d-dot" />
          <span className="three-d-dot" />
        </div>
        <div className="three-d-hud hud-right">
          <span />
          <span />
          <span />
        </div>

        <div className="three-d-copy">
          <p className="three-d-label">{label}</p>
          <h3 className="three-d-title">{title}</h3>
          <p className="three-d-subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
