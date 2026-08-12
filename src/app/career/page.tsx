import { ApplicationShell } from "@/components/application-shell";
import { CareerDashboard } from "@/components/career-dashboard";
import { requireAuthenticatedPage } from "@/lib/page-auth";
export default async function CareerPage() { await requireAuthenticatedPage(); return <ApplicationShell title="Career"><CareerDashboard mode="career" /></ApplicationShell>; }
