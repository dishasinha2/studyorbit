import { ApplicationShell } from "@/components/application-shell";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function AiPage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="AI guidance"><AiChatPanel /></ApplicationShell>
  );
}
