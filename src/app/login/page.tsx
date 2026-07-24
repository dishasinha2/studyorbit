import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/auth?next=%2Fdashboard");
  return null;
}
