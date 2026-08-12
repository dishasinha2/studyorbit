import { requireAuthenticatedPage } from "@/lib/page-auth";
export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireAuthenticatedPage(); return children; }
