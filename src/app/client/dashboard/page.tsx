import { redirect } from "next/navigation";

// The Client experience is now task-driven (see spec) — this route is kept
// only as a redirect so old bookmarks/back-button history don't 404.
export default function ClientDashboardRedirect() {
  redirect("/client/home");
}
