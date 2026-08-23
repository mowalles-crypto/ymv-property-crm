import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin/dashboard");
  if (!profile.customer_id) redirect("/register/complete-requirements");
  redirect("/client/dashboard");
}
