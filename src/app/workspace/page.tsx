"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { UserProfilePanel } from "@/components/user-profile-panel";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceSidebarItems, type WorkspaceModuleId } from "@/lib/workspace-config";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moduleCounts, setModuleCounts] = useState<Partial<Record<WorkspaceModuleId, number>>>({});
  const activeModule = (searchParams.get("module") as WorkspaceModuleId | null) ?? "dashboard";
  const activeItem = workspaceSidebarItems.find((item) => item.id === activeModule) ?? workspaceSidebarItems[1];

  const groupedSidebarItems = useMemo(() => ({
    workspace: workspaceSidebarItems.slice(0, 2),
    resources: workspaceSidebarItems.slice(2, 6),
    focus: workspaceSidebarItems.slice(6),
  }), []);

  const renderSidebarItem = (item: (typeof workspaceSidebarItems)[number], collapsed = false, trailingSparkle = false) => (
    <Link
      key={item.id}
      href={`/workspace?module=${item.id}`}
      className={`module-nav-card ${collapsed ? "module-nav-card-compact" : ""} block ${activeModule === item.id ? "module-nav-card-active" : ""}`}
    >
      {activeModule === item.id ? (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="sidebar-active-indicator"
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      ) : null}
      {collapsed ? (
        <span className="module-icon-wrap mx-auto">
          <item.icon className="h-4 w-4" style={{ color: activeModule === item.id ? "#6366f1" : "#94a3b8" }} />
        </span>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="module-icon-wrap">
              <item.icon className="h-4 w-4" style={{ color: activeModule === item.id ? "#6366f1" : "#94a3b8" }} />
            </span>
            <div>
              <span className="block text-sm font-semibold" style={{ color: activeModule === item.id ? "#1e293b" : "#334155" }}>
                {item.label}
              </span>
              <span className="block text-[11px]" style={{ color: "#94a3b8" }}>{item.meta}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="module-badge">{moduleCounts[item.id] ?? 0}</span>
            {trailingSparkle ? (
              <Sparkles className="h-3.5 w-3.5" style={{ color: activeModule === item.id ? "#6366f1" : "#cbd5e1" }} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" style={{ color: activeModule === item.id ? "#6366f1" : "#cbd5e1" }} />
            )}
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <AppSurface>
      <section className="mx-auto max-w-7xl space-y-6">
        <SiteNav active="features" />

        <section className={`workspace-grid ${sidebarCollapsed ? "workspace-grid-collapsed" : ""}`}>

          {/* ────────── Sidebar ────────── */}
          <aside className={`panel-strong shell-frame sidebar-shell workspace-sidebar ${sidebarCollapsed ? "workspace-sidebar-collapsed" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              {!sidebarCollapsed && (
                <div>
                  <span className="accent-pill" style={{ animation: "none" }}>
                    <Sparkles className="h-3 w-3" /> StudyOrbit
                  </span>
                  <h2 className="mt-2 text-xl font-black" style={{ color: "#1e293b", letterSpacing: "-0.03em" }}>
                    Workspace
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                    One control center for study, focus, and resources.
                  </p>
                </div>
              )}
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {!sidebarCollapsed ? (
                <>
                  <div>
                    <p className="sidebar-group-label">Workspace</p>
                    <div className="mt-2 grid gap-2">
                      {groupedSidebarItems.workspace.map((item) => renderSidebarItem(item))}
                    </div>
                  </div>
                  <div>
                    <p className="sidebar-group-label">Resources</p>
                    <div className="mt-2 grid gap-2">
                      {groupedSidebarItems.resources.map((item) => renderSidebarItem(item))}
                    </div>
                  </div>
                  <div>
                    <p className="sidebar-group-label">Focus</p>
                    <div className="mt-2 grid gap-2">
                      {groupedSidebarItems.focus.map((item) => renderSidebarItem(item, false, true))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  {workspaceSidebarItems.map((item) => renderSidebarItem(item, true))}
                </div>
              )}
            </div>

            <div className="soft-divider my-4" />

            {!sidebarCollapsed ? (
              <UserProfilePanel compact />
            ) : (
              <div className="sidebar-profile justify-center">
                <div className="sidebar-profile-avatar">SO</div>
              </div>
            )}

            <Link href="/dashboard" className="btn-secondary mt-4 block px-4 py-2 text-center text-sm">
              {sidebarCollapsed ? <ChevronLeft className="mx-auto h-4 w-4" /> : "← Back to dashboard"}
            </Link>
          </aside>

          {/* ────────── Main ────────── */}
          <div className="space-y-6">

            {/* Hero header */}
            <motion.header
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="panel-strong shell-frame workspace-hero workspace-hero-dense p-6 md:p-8"
            >
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                {/* Left */}
                <div className="relative z-10">
                  <span className="accent-pill">
                    <Sparkles className="h-3 w-3" /> StudyOrbit Workspace
                  </span>
                  <h1
                    className="mt-3 text-3xl font-black leading-tight md:text-4xl"
                    style={{ color: "#1e293b", letterSpacing: "-0.04em" }}
                  >
                    Dense study{" "}
                    <span className="text-shimmer">workflow.</span>
                    <span
                      className="mt-1 block text-balance text-xl md:text-2xl"
                      style={{ color: "#4f46e5", fontWeight: 700 }}
                    >
                      Plan, focus, save resources, and keep momentum.
                    </span>
                  </h1>
                  <p className="mt-3 text-sm" style={{ color: "#64748b", maxWidth: "38rem" }}>
                    Use the sidebar to move across modules. The active module stays focused; the
                    dashboard keeps the whole day visible.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Now open", value: activeItem.label },
                      { label: "Mode",     value: "Power user" },
                    ].map((card) => (
                      <motion.div
                        key={card.label}
                        whileHover={{ y: -3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="workspace-highlight-card"
                      >
                        <p className="workspace-highlight-label">{card.label}</p>
                        <p className="workspace-highlight-value">{card.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Right */}
                <div className="relative z-10 space-y-3">
                  {[
                    { label: "Open",  desc: "One module stays centered while the rest stays quiet." },
                    { label: "Flow",  desc: "Depth is carried by transitions and surfaces, not loud blocks." },
                    { label: "Clear", desc: "Minimal sections, cleaner hierarchy, and softer contrast." },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                      className="hero-metric"
                    >
                      <p className="hero-metric-value" style={{ fontSize: "1.1rem" }}>{card.label}</p>
                      <p className="hero-metric-label" style={{ fontSize: "0.8rem" }}>{card.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.header>

            {/* Module panel */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={activeModule}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="panel shell-frame p-4 md:p-5"
              >
                <WorkspaceShell activeModule={activeModule} onCountsChange={setModuleCounts} />
              </motion.section>
            </AnimatePresence>
          </div>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <AppSurface>
          <section className="mx-auto max-w-7xl space-y-6">
            <SiteNav active="features" />
            <section className="panel-strong p-8">
              <span className="accent-pill" style={{ display: "inline-flex" }}>
                <Sparkles className="h-3 w-3" /> Workspace
              </span>
              <h1 className="mt-3 text-3xl font-black" style={{ color: "#1e293b" }}>
                Loading workspace…
              </h1>
            </section>
            <SiteFooter />
          </section>
        </AppSurface>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
