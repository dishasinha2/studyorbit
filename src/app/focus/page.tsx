import { AppSurface } from "@/components/app-surface";
import { FocusPanel } from "@/components/focus-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function FocusPage() {
  return (
    <AppSurface>
      <SiteNav active="focus" />
      <div className="my-8">
        <FocusPanel />
      </div>
      <SiteFooter />
    </AppSurface>
  );
}
