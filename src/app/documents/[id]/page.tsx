import { ApplicationShell } from "@/components/application-shell";
import { DocumentWorkspacePanel } from "@/components/document-workspace-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentWorkspacePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <ApplicationShell title="Documents"><DocumentWorkspacePanel documentId={id} /></ApplicationShell>
  );
}
