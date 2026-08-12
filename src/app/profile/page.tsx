import { ApplicationShell } from "@/components/application-shell";
import { UserProfilePanel } from "@/components/user-profile-panel";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function ProfilePage() {
  await requireAuthenticatedPage();
  return (
    <ApplicationShell title="Profile">
      <section className="profile-premium">
        <section>
          <UserProfilePanel />
        </section>
      </section>
    </ApplicationShell>
  );
}
