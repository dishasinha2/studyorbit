"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ApplicationShell } from "@/components/application-shell";
import { WorkspaceShell } from "@/components/workspace-shell";
import { workspaceSidebarItems, type WorkspaceModuleId } from "@/lib/workspace-config";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const [moduleCounts, setModuleCounts] = useState<Partial<Record<WorkspaceModuleId, number>>>({});
  const requestedModule = searchParams.get("module") as WorkspaceModuleId | null;
  const activeModule = workspaceSidebarItems.some((item) => item.id === requestedModule) ? requestedModule! : "dashboard";

  return (
    <ApplicationShell title="Workspace">
      <section className="workspace-single space-y-4">
        <nav className="workspace-tool-nav" aria-label="Workspace tools">
          {workspaceSidebarItems.map((item) => {
            const active = item.id === activeModule;
            return (
              <Link key={item.id} href={`/workspace?module=${item.id}`} className={`workspace-tool-link ${active ? "workspace-tool-link-active" : ""}`}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {(moduleCounts[item.id] ?? 0) > 0 ? <small>{moduleCounts[item.id]}</small> : null}
              </Link>
            );
          })}
        </nav>

        <motion.section
          key={activeModule}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="workspace-main-panel panel shell-frame p-4 md:p-6"
        >
          <WorkspaceShell activeModule={activeModule} onCountsChange={setModuleCounts} />
        </motion.section>
      </section>
    </ApplicationShell>
  );
}

export default function WorkspacePage() {
  return <Suspense fallback={<ApplicationShell title="Workspace"><div className="panel p-6 text-sm text-slate-500">Loading workspace…</div></ApplicationShell>}><WorkspaceContent /></Suspense>;
}
