import { ApplicationShell } from "@/components/application-shell";
import { DocumentManagerPanel } from "@/components/document-manager-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function DocumentsPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Documents"><DocumentManagerPanel /></ApplicationShell>
  );
}
