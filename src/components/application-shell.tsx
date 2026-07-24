"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, CalendarDays, Command, Focus, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Search, Settings, Sparkles, UserRound, BriefcaseBusiness, Heart } from "lucide-react";
import { clearFirebaseSession } from "@/lib/firebase-client";

const navItems = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/documents", label: "Documents", icon: BookOpen }, { href: "/calendar", label: "Calendar", icon: CalendarDays }, { href: "/notifications", label: "Notifications", icon: Bell }, { href: "/workspace", label: "Workspace", icon: Command }, { href: "/career", label: "Career", icon: BriefcaseBusiness }, { href: "/focus", label: "Focus", icon: Focus }, { href: "/relax", label: "Relax", icon: Heart }, { href: "/profile", label: "Profile", icon: UserRound }, { href: "/settings", label: "Settings", icon: Settings }];

export function ApplicationShell({ title, children }: { title: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  async function signOut() { await clearFirebaseSession(); router.replace("/auth"); }
  return <div className={`app-layout ${collapsed ? "app-layout-collapsed" : ""}`}><aside className="app-sidebar"><div className="app-brand"><span className="app-brand-mark"><Sparkles className="h-4 w-4" /></span>{!collapsed && <span>StudyOrbit</span>}<button type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar" className="sidebar-collapse">{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button></div><nav className="app-nav" aria-label="Application navigation">{navItems.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} className={`app-nav-item ${active ? "app-nav-item-active" : ""}`} title={collapsed ? label : undefined}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}</Link>; })}</nav><button type="button" className="app-signout" onClick={() => void signOut()} title={collapsed ? "Log out" : undefined}><LogOut className="h-4 w-4" /> {!collapsed && <span>Log out</span>}</button></aside><div className="app-main"><header className="app-topbar"><div><p className="app-breadcrumb">StudyOrbit / {title}</p><h1>{title}</h1></div><div className="app-topbar-actions"><label className="app-search"><Search className="h-4 w-4" /><input aria-label="Search" placeholder="Search" /></label><Link href="/notifications" aria-label="Notifications" className="app-icon-button"><Bell className="h-4 w-4" /></Link><Link href="/profile" aria-label="Profile" className="app-avatar">SO</Link></div></header><main className="app-page-content">{children}</main></div></div>;
}
