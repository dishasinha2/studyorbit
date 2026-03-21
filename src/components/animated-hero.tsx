"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarCheck2,
  FileStack,
  Flame,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "./magnetic-button";
import { TextReveal } from "./text-reveal";
import { TiltCard } from "./tilt-card";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
};

const featureCards = [
  {
    icon: CalendarCheck2,
    title: "Plan",
    desc: "Tasks, dates, reminders.",
    eyebrow: "Core tool",
    accent: "rgba(99,102,241,0.12)",
    iconColor: "#6366f1",
  },
  {
    icon: FileStack,
    title: "Store",
    desc: "Files, notes, links.",
    eyebrow: "Core tool",
    accent: "rgba(139,92,246,0.12)",
    iconColor: "#7c3aed",
  },
  {
    icon: Timer,
    title: "Focus",
    desc: "Sessions and breaks.",
    eyebrow: "Core tool",
    accent: "rgba(236,72,153,0.1)",
    iconColor: "#db2777",
  },
];

const stats = [
  {
    icon: BookOpen,
    val: "6",
    unit: "tools",
    label: "Core study modules",
    accent: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
  },
  {
    icon: BrainCircuit,
    val: "100%",
    unit: "",
    label: "Built for deep focus",
    accent: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    icon: Flame,
    val: "0",
    unit: "clutter",
    label: "Only the work you need",
    accent: "#db2777",
    bg: "rgba(219,39,119,0.07)",
  },
];

const metricCards = [
  {
    eyebrow: "Study flow",
    label: "Calm",
    body: "Soft motion keeps reading and planning comfortable.",
  },
  {
    eyebrow: "Interface",
    label: "Clear",
    body: "Cleaner sections keep attention on the work.",
  },
];

export function AnimatedHero() {
  return (
    <section className="panel-strong shell-frame hero-panel overflow-hidden p-8 md:p-12">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10">
          <motion.span variants={itemVariants} className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Your Academic Command Centre
          </motion.span>

          <TextReveal
            text="Stop tab-hopping. Own your study game."
            className="hero-title mt-5 max-w-3xl text-4xl font-black leading-tight md:text-5xl"
            delay={0.12}
          />

          <motion.p
            variants={itemVariants}
            className="mt-2 text-xl font-bold md:text-2xl text-shimmer"
            style={{ letterSpacing: "-0.02em" }}
          >
            One orbit. Every tool. Zero chaos.
          </motion.p>

          <motion.p variants={itemVariants} className="hero-lead mt-4 text-base md:text-lg">
            Tasks, notes, files, focus sessions, and revision links all stay in one workspace built for students who
            want a cleaner system.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-7 flex flex-wrap gap-3">
            <MagneticButton strength={25}>
              <Link href="/auth" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm group">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </MagneticButton>
            <MagneticButton strength={25}>
              <Link href="/dashboard" className="btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: "#6366f1" }} />
                Open Dashboard
              </Link>
            </MagneticButton>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((stat, index) => (
              <TiltCard key={index} className="stat-pill" intensity={12}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    borderRadius: "999px 999px 0 0",
                    background: stat.accent,
                    opacity: 0.7,
                  }}
                />
                <span
                  className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{
                    background: stat.bg,
                    border: `1px solid ${stat.accent}22`,
                    color: stat.accent,
                  }}
                >
                  <stat.icon className="h-4 w-4" />
                </span>
                <p
                  className="stat-value"
                  style={{
                    background: `linear-gradient(135deg, #1e293b, ${stat.accent})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: "1.5rem",
                  }}
                >
                  {stat.val}
                  {stat.unit ? <span className="ml-1 text-[0.8rem] opacity-75">{stat.unit}</span> : null}
                </p>
                <p className="stat-label mt-0.5">{stat.label}</p>
              </TiltCard>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 space-y-4"
        >
          <motion.div variants={itemVariants} className="grid gap-3 md:grid-cols-2">
            {featureCards.map((card, index) => (
              <TiltCard
                key={card.title}
                className={`feature-card-strong group/feature ${index === 0 ? "min-h-[176px] md:col-span-2" : "min-h-[188px]"}`}
                intensity={8}
              >
                <span
                  className="icon-badge"
                  style={{
                    background: card.accent,
                    border: `1px solid ${card.iconColor}22`,
                    color: card.iconColor,
                  }}
                >
                  <motion.span
                    whileHover={{ y: -2, rotate: index === 2 ? -8 : 8, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="inline-flex"
                  >
                    <card.icon className="h-5 w-5" />
                  </motion.span>
                </span>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: card.iconColor }}>
                  {card.eyebrow}
                </p>
                <h2 className="mt-2 text-base font-bold text-slate-800">{card.title}</h2>
                <p className="mt-2 text-[0.92rem] leading-6 text-slate-500">{card.desc}</p>
              </TiltCard>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2">
            {metricCards.map((card) => (
              <TiltCard key={card.label} className="hero-metric min-h-[180px]" intensity={8}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.eyebrow}</p>
                <p
                  className="hero-metric-value mt-4"
                  style={{
                    background: "linear-gradient(135deg, #1e293b, #4f46e5)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {card.label}
                </p>
                <p className="hero-metric-label mt-3">{card.body}</p>
              </TiltCard>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="feature-card flex items-center gap-3 px-5 py-4">
            <span
              className="flex h-2.5 w-2.5 rounded-full"
              style={{
                background: "#22c55e",
                boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
                animation: "pulse-glow 2s ease infinite",
              }}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live workspace</p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Tasks, notes, links, and focus progress stay in sync.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
