"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const springConfig = { damping: 28, stiffness: 180, mass: 0.6 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const update = (e: MouseEvent) => {
      cursorX.set(e.clientX - 220);
      cursorY.set(e.clientY - 220);
      if (!isVisible) setIsVisible(true);
    };
    const hide = () => setIsVisible(false);
    const show = () => setIsVisible(true);

    window.addEventListener("mousemove", update);
    document.body.addEventListener("mouseleave", hide);
    document.body.addEventListener("mouseenter", show);
    return () => {
      window.removeEventListener("mousemove", update);
      document.body.removeEventListener("mouseleave", hide);
      document.body.removeEventListener("mouseenter", show);
    };
  }, [cursorX, cursorY, isVisible]);

  if (!mounted) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-0 rounded-full will-change-transform"
      style={{
        x: cursorX,
        y: cursorY,
        width: 440,
        height: 440,
        background:
          "radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
        filter: "blur(36px)",
      }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.55 }}
    />
  );
}
