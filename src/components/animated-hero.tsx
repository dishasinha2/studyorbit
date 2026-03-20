"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles, ArrowRight, CalendarCheck2, FileStack, Timer, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { TiltCard } from "./tilt-card";
import { MagneticButton } from "./magnetic-button";
import { TextReveal } from "./text-reveal";

export function AnimatedHero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <section className="panel-strong shell-frame hero-panel overflow-hidden p-8 md:p-12">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10"
        >
          <motion.p variants={itemVariants} className="section-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Simple Study Workspace
          </motion.p>
          
          <TextReveal 
            text="Study from one clean dashboard."
            className="hero-title mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500"
            delay={0.15}
          />
          
          <motion.p variants={itemVariants} className="hero-lead mt-4 text-base md:text-lg">
            Plan tasks, save notes, manage files, store useful links, and start a focus session without switching between scattered tools.
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-7 flex flex-wrap gap-3">
            <MagneticButton strength={25}>
              <Link href="/auth" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm group">
                Login <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>
            <MagneticButton strength={25}>
              <Link href="/dashboard" className="btn-secondary px-5 py-2.5 text-sm">
                Open Dashboard
              </Link>
            </MagneticButton>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-10 grid gap-3 sm:grid-cols-3">
            {[ 
              { val: "6", label: "Core study tools" }, 
              { val: "1", label: "Focused workspace" }, 
              { val: "0 clutter", label: "Only the work you need" } 
            ].map((stat, i) => (
              <TiltCard key={i} className="stat-pill" intensity={12}>
                <p className="stat-value">{stat.val}</p>
                <p className="stat-label">{stat.label}</p>
              </TiltCard>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Column Grid */}
        <motion.div 
          className="relative z-10 hero-grid grid-glow"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <TiltCard className="feature-card-strong">
            <span className="icon-badge">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Plan your day</h2>
            <p>Tasks, schedule, and reminders in one place.</p>
          </TiltCard>
          
          <TiltCard className="feature-card-strong">
            <span className="icon-badge">
              <FileStack className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Manage study material</h2>
            <p>Files, notes, videos, and GPT links stay organized.</p>
          </TiltCard>
          
          <TiltCard className="feature-card-strong">
            <span className="icon-badge">
              <Timer className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold">Stay in focus</h2>
            <p>Run study sessions and breaks with a dedicated timer.</p>
          </TiltCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <TiltCard className="hero-metric" intensity={10}>
              <p className="hero-metric-value">Today</p>
              <p className="hero-metric-label">Open the dashboard and continue from where you stopped.</p>
            </TiltCard>
            <TiltCard className="hero-metric" intensity={10}>
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Clean flow
              </div>
              <p className="hero-metric-label">Capture, organize, and execute without switching contexts.</p>
            </TiltCard>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
