import Link from "next/link";

type SiteNavProps = {
  active?: "intro" | "auth" | "dashboard" | "features";
};

function navClass(active: boolean) {
  return active ? "chip chip-active shadow-sm" : "chip hover:-translate-y-0.5";
}

export function SiteNav({ active }: SiteNavProps) {
  return (
    <header className="panel nav-shell shell-frame sticky top-4 z-30 p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-badge h-10 w-10 rounded-2xl">
            <span className="text-sm font-black tracking-[0.18em]">SO</span>
          </span>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">StudyOrbit</p>
          <p className="text-sm text-zinc-400">Study workspace</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-xs">
          <Link href="/" className={navClass(active === "intro")}>Intro</Link>
          <Link href="/auth" className={navClass(active === "auth")}>Login</Link>
          <Link href="/dashboard" className={navClass(active === "dashboard")}>Dashboard</Link>
          <Link href="/workspace" className={navClass(active === "features")}>Workspace</Link>
        </nav>
      </div>
    </header>
  );
}
