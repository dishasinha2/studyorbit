import { requireAuthenticatedPage } from "@/lib/page-auth";
export default async function DocumentsLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireAuthenticatedPage(); return children; }
