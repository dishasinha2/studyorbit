import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/auth?next=%2Fdashboard");
  return null;
}
