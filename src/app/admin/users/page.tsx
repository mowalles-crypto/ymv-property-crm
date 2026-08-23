import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, customers(customer_name)")
    .order("created_at", { ascending: false });

  const adminClient = createAdminClient();
  const emailByUserId = new Map<string, string>();
  for (const p of profiles ?? []) {
    const { data } = await adminClient.auth.admin.getUserById(p.user_id);
    if (data.user?.email) emailByUserId.set(p.user_id, data.user.email);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{t.nav.users}</h2>
      <p className="text-sm text-slate-500">
        Admin privileges can only be granted through a secure administrative
        process (a direct database action) — never from this screen or any
        client-supplied value.
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Linked client</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2.5 pr-4 text-slate-900">
                    {emailByUserId.get(p.user_id) ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.role === "admin"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.role}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(p.customers as any)?.customer_name ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{formatDate(p.created_at)}</td>
                </tr>
              ))}
              {(!profiles || profiles.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    {t.common.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
