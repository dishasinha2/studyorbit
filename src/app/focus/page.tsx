import { ApplicationShell } from "@/components/application-shell";
import { FocusPanel } from "@/components/focus-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function FocusPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Focus"><FocusPanel /></ApplicationShell>
  );
}
