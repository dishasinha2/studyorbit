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
          <item.icon className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-300" : "text-slate-400"}`} />
        </span>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="module-icon-wrap">
              <item.icon className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-300" : "text-slate-400"}`} />
            </span>
            <div>
              <span className="block text-sm font-medium text-slate-100">{item.label}</span>
              <span className="block text-[11px] text-slate-400">{item.meta}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="module-badge">{moduleCounts[item.id] ?? 0}</span>
            {trailingSparkle ? (
              <Sparkles className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-300" : "text-slate-500"}`} />
            ) : (
              <ChevronRight className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-300" : "text-slate-500"}`} />
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
          <aside className={`panel-strong shell-frame sidebar-shell workspace-sidebar ${sidebarCollapsed ? "workspace-sidebar-collapsed" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={sidebarCollapsed ? "hidden" : "block"}>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">StudyOrbit</p>
                <h2 className="mt-2 text-xl font-black text-slate-50">Workspace</h2>
                <p className="mt-1 text-sm text-slate-400">One control center for study, focus, and resources.</p>
              </div>
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed((value) => !value)}
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
            <div className={`sidebar-profile ${sidebarCollapsed ? "justify-center" : ""}`}>
              <div className="sidebar-profile-avatar">SO</div>
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">StudyOrbit User</p>
                  <p className="text-xs text-slate-400">Focus-ready workspace</p>
                </div>
              ) : null}
            </div>
            <Link href="/dashboard" className="btn-secondary mt-4 block px-4 py-2 text-center text-sm">
              {sidebarCollapsed ? <ChevronLeft className="mx-auto h-4 w-4" /> : "Back to dashboard"}
            </Link>
          </aside>

          <div className="space-y-6">
            <header className="panel-strong shell-frame workspace-hero workspace-hero-dense p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">StudyOrbit Workspace</p>
                  <h1 className="mt-3 text-3xl font-black leading-tight text-slate-50 md:text-5xl">
                    Dense study workflow.
                    <span className="block text-balance text-slate-300">Plan, focus, save resources, and keep momentum.</span>
                  </h1>
                  <p className="mt-3 text-sm text-slate-400">Use the sidebar to move across modules. The active module stays focused; the dashboard keeps the whole day visible.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="workspace-highlight-card">
                    <p className="workspace-highlight-label">Now open</p>
                    <p className="workspace-highlight-value">{activeItem.label}</p>
                  </div>
                  <div className="workspace-highlight-card">
                    <p className="workspace-highlight-label">Mode</p>
                    <p className="workspace-highlight-value">Power user</p>
                  </div>
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={activeModule}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="panel shell-frame p-3 md:p-4"
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
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Workspace</p>
              <h1 className="mt-2 text-3xl font-black text-slate-700">Loading workspace</h1>
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
