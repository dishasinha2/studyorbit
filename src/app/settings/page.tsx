import { ApplicationShell } from "@/components/application-shell";
import { SettingsPanel } from "@/components/settings-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function SettingsPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Settings">
      <SettingsPanel />
    </ApplicationShell>
  );
}
