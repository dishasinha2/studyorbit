"use client";

import { motion } from "framer-motion";

type AuthMode = "login" | "signup" | "reset";

const tabOptions: { id: AuthMode; label: string }[] = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Sign up" },
  { id: "reset", label: "Reset" },
];

export function AuthTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Authentication options"
      className="relative flex rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] p-1 backdrop-blur-md"
    >
      {tabOptions.map((tab) => {
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`auth-panel-${tab.id}`}
            id={`auth-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex-1 rounded-lg py-2 text-center font-sans text-xs font-semibold sm:text-sm transition-colors focus-visible:outline-none ${
              isActive
                ? "text-[var(--void-deep)] font-bold"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeAuthTabIndicator"
                className="absolute inset-0 z-[-1] rounded-lg bg-[linear-gradient(135deg,var(--gold),#ffdc93)] shadow-[0_4px_14px_rgba(255,200,87,0.3)]"
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type { AuthMode };


