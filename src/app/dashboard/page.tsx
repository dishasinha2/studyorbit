import { ApplicationShell } from "@/components/application-shell";
import { CareerDashboard } from "@/components/career-dashboard";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function DashboardPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Dashboard"><CareerDashboard /></ApplicationShell>
  );
}
