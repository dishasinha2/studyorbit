import { ApplicationShell } from "@/components/application-shell";
import { NotificationCenterPanel } from "@/components/notification-center-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export const metadata = {
  title: "Notification Center - StudyOrbit",
  description: "Manage task reminders, deadline alerts, reading prompts, revision notes, AI recommendations, and notification preferences.",
};

export default async function NotificationsPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Notifications"><NotificationCenterPanel /></ApplicationShell>
  );
}
