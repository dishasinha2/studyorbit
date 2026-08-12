import { requireAuthenticatedPage } from "@/lib/page-auth";
export default async function RelaxLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireAuthenticatedPage(); return children; }
