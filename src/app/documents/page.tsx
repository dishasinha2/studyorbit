import { AppSurface } from "@/components/app-surface";
import { DocumentManagerPanel } from "@/components/document-manager-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function DocumentsPage() {
  return (
    <AppSurface>
      <section className="mx-auto flex max-w-6xl flex-col gap-5">
        <SiteNav active="documents" />
        <DocumentManagerPanel />
        <SiteFooter />
      </section>
    </AppSurface>
  );
}
