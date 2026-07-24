import { AppSurface } from "@/components/app-surface";
import { NotificationCenterPanel } from "@/components/notification-center-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const metadata = {
  title: "Notification Center - StudyOrbit",
  description: "Manage task reminders, deadline alerts, reading prompts, revision notes, AI recommendations, and notification preferences.",
};

export default function NotificationsPage() {
  return (
    <AppSurface>
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <SiteNav active="notifications" />
        <main className="w-full">
          <NotificationCenterPanel />
        </main>
        <SiteFooter />
      </section>
    </AppSurface>
  );
}
