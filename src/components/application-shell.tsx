"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Command, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Search, Settings, Sparkles, UserRound, BriefcaseBusiness, Heart, Bot } from "lucide-react";
import { clearFirebaseSession } from "@/lib/firebase-client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "Workspace", icon: Command },
  { href: "/documents", label: "Library", icon: BookOpen },
  { href: "/relax", label: "Relax", icon: Heart },
  { href: "/career", label: "Career", icon: BriefcaseBusiness },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ApplicationShell({ title, children }: { title: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false); const pathname = usePathname();
  async function signOut() { await clearFirebaseSession(); window.location.assign("/"); }
  return <div className={`app-layout ${collapsed ? "app-layout-collapsed" : ""}`}><aside className="app-sidebar"><div className="app-brand"><span className="app-brand-mark"><Sparkles className="h-4 w-4" /></span>{!collapsed && <span>StudyOrbit</span>}<button type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar" className="sidebar-collapse">{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button></div><nav className="app-nav" aria-label="Application navigation">{navItems.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)); const ariaLabel = label || "AI guidance"; return <Link key={href} href={href} aria-current={active ? "page" : undefined} aria-label={ariaLabel} className={`app-nav-item ${active ? "app-nav-item-active" : ""}`} title={collapsed ? ariaLabel : undefined}><Icon className="h-4 w-4 shrink-0" />{!collapsed && label ? <span>{label}</span> : null}</Link>; })}</nav><button type="button" aria-label="Log out" className="app-signout" onClick={() => void signOut()}><LogOut className="h-4 w-4" /> {!collapsed && <span>Log out</span>}</button></aside><div className="app-main"><header className="app-topbar"><div><p className="app-breadcrumb">{title}</p><h1>{title}</h1></div><div className="app-topbar-actions"><label className="app-search"><Search className="h-4 w-4" /><input aria-label="Search" placeholder="Search" /></label><Link href="/notifications" aria-label="Notifications" className="app-icon-button"><Bell className="h-4 w-4" /></Link><Link href="/profile" aria-label="Profile" className="app-avatar"><UserRound className="h-4 w-4" /></Link></div></header><main className="app-page-content">{children}</main><Link href="/ai" aria-label="Open AI guidance" className="fab"><Bot className="h-5 w-5" /></Link></div></div>;
}
