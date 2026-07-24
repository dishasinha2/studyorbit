import { AppSurface } from "@/components/app-surface";
import { CareerDashboard } from "@/components/career-dashboard";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function DashboardPage() {
  return (
    <AppSurface>
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <SiteNav active="dashboard" />
        <CareerDashboard />
        <SiteFooter />
      </section>
    </AppSurface>
  );
}
