import { AppSurface } from "@/components/app-surface";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function AiPage() {
  return (
    <AppSurface>
      <section className="mx-auto max-w-7xl space-y-6">
        <SiteNav active="ai" />
        <AiChatPanel />
        <SiteFooter />
      </section>
    </AppSurface>
  );
}

