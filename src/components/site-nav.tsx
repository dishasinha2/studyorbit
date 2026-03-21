import Link from "next/link";
import { Sparkles } from "lucide-react";

type SiteNavProps = {
  active?: "intro" | "auth" | "dashboard" | "features" | "profile";
};

function navClass(active: boolean) {
  return active
    ? "chip chip-active shadow-sm font-semibold"
    : "chip hover:-translate-y-0.5 transition-transform";
}

export function SiteNav({ active }: SiteNavProps) {
  return (
    <header className="panel nav-shell shell-frame sticky top-4 z-30 p-3.5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span
            className="nav-icon-3d icon-badge h-10 w-10 rounded-2xl"
            style={{
              background: "linear-gradient(145deg, rgba(237,233,254,0.95), rgba(219,234,254,0.92))",
              color: "#6366f1",
            }}
          >
            <span className="text-sm font-black tracking-[0.14em]" style={{ color: "#4f46e5" }}>SO</span>
          </span>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "#6366f1" }}
            >
              StudyOrbit
            </p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>Spatial study workspace</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <Link href="/"          className={navClass(active === "intro")}>Intro</Link>
          <Link href="/auth"      className={navClass(active === "auth")}>Login</Link>
          <Link href="/dashboard" className={navClass(active === "dashboard")}>Dashboard</Link>
          <Link href="/profile"   className={navClass(active === "profile")}>Profile</Link>
          <Link
            href="/workspace"
            className={`${navClass(active === "features")} inline-flex items-center gap-1`}
          >
            {active === "features" && <Sparkles className="h-3 w-3" style={{ color: "#6366f1" }} />}
            Workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}
