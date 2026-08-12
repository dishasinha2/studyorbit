import { ApplicationShell } from "@/components/application-shell";
import { CalendarTimelinePanel } from "@/components/calendar-timeline-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";
export default async function CalendarPage() { await requireAuthenticatedPage(); return <ApplicationShell title="Calendar"><CalendarTimelinePanel /></ApplicationShell>; }
