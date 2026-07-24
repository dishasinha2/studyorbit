import { AppSurface } from "@/components/app-surface";
import { DocumentWorkspacePanel } from "@/components/document-workspace-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentWorkspacePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AppSurface>
      <section className="mx-auto flex max-w-7xl flex-col gap-5">
        <SiteNav active="documents" />
        <DocumentWorkspacePanel documentId={id} />
        <SiteFooter />
      </section>
    </AppSurface>
  );
}
