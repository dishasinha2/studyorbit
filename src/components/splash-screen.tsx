"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);
  return <>{visible && <div className="splash-screen" role="status" aria-label="Opening StudyOrbit"><div className="splash-orbit splash-orbit-one" /><div className="splash-orbit splash-orbit-two" /><div className="splash-mark"><Sparkles className="h-6 w-6" /></div><p>StudyOrbit</p></div>}<div className={visible ? "opacity-0" : "splash-content-ready"}>{children}</div></>;
}
