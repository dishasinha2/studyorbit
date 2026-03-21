"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function InterfaceReveal() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), 1350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="interface-reveal"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
        >
          <motion.div
            className="interface-reveal-core"
            initial={{ scale: 0.72, rotate: -16, opacity: 0.2 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="interface-reveal-orb interface-reveal-orb-a"
            initial={{ x: -120, y: 30, scale: 0.7, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="interface-reveal-orb interface-reveal-orb-b"
            initial={{ x: 140, y: -40, scale: 0.7, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="interface-reveal-line"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="interface-reveal-wordmark"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="interface-reveal-brand">StudyOrbit</p>
            <p className="interface-reveal-tag">Personal study workspace</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
