"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceSidebarItems, type WorkspaceModuleId } from "@/lib/workspace-config";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const activeModule = (searchParams.get("module") as WorkspaceModuleId | null) ?? "dashboard";
  const activeItem = workspaceSidebarItems.find((item) => item.id === activeModule) ?? workspaceSidebarItems[1];

  return (
    <AppSurface>
      <section className="mx-auto max-w-7xl space-y-6">
        <SiteNav active="features" />

        <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="panel-strong shell-frame sidebar-shell p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Workspace</p>
            <h2 className="mt-2 text-xl font-black text-slate-700">Study tools</h2>
            <p className="mt-1 text-sm text-slate-500">Pick one focused module.</p>
            <div className="mt-4 grid gap-2">
              {workspaceSidebarItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/workspace?module=${item.id}`}
                  className={`module-nav-card block ${activeModule === item.id ? "module-nav-card-active" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="module-icon-wrap">
                        <item.icon className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-500" : "text-slate-500"}`} />
                      </span>
                      <div>
                        <span className="block text-sm font-medium text-slate-700">{item.label}</span>
                        <span className="block text-[11px] text-slate-500">{item.meta}</span>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${activeModule === item.id ? "text-cyan-500" : "text-slate-400"}`} />
                  </div>
                </Link>
              ))}
            </div>
            <div className="soft-divider my-4" />
            <Link href="/dashboard" className="btn-secondary block px-4 py-2 text-center text-sm">
              Back to dashboard
            </Link>
          </aside>

          <div className="space-y-6">
            <header className="panel-strong shell-frame workspace-hero p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Active Module</p>
                  <h1 className="mt-2 text-3xl font-black text-slate-700 md:text-4xl">{activeItem.label}</h1>
                  <p className="mt-1 text-sm text-slate-500">One focused workspace at a time.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="workspace-stat">
                      <p className="workspace-stat-value">1 module</p>
                      <p className="workspace-stat-label">Focused view keeps the page clean.</p>
                    </div>
                    <div className="workspace-stat">
                      <p className="workspace-stat-value">{activeItem.meta}</p>
                      <p className="workspace-stat-label">Current workspace purpose.</p>
                    </div>
                    <div className="workspace-stat">
                      <p className="workspace-stat-value">Study flow</p>
                      <p className="workspace-stat-label">Capture, act, and review in sequence.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {workspaceSidebarItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/workspace?module=${item.id}`}
                      className={`chip text-xs ${activeModule === item.id ? "chip-active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </header>

            <section className="panel shell-frame p-3 md:p-4">
              <WorkspaceShell activeModule={activeModule} />
            </section>
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
