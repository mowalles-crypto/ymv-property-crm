/**
 * Exercises RLS directly against the Data API — no service role, no
 * frontend — using the same publishable key + password auth a real client
 * would use. Verifies the boundaries from spec section 36:
 *   - admin: full read/write across all tables
 *   - client A: reads only their own data, cannot write business data,
 *     cannot see client B's data (and vice versa)
 *   - anonymous (no session): blocked from every table
 *
 * Requires scripts/seed.mjs to have been run first (uses its demo users).
 * Usage: node scripts/test-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import WebSocket from "ws";

config({ path: ".env.local" });
globalThis.WebSocket ??= WebSocket;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const creds = Object.fromEntries(
  readFileSync(".secrets/demo-credentials.txt", "utf8")
    .split("\n")
    .filter((l) => l.includes("@"))
    .map((l) => l.trim().split(/\s+/))
);

let pass = 0;
let fail = 0;
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function signIn(email) {
  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: creds[email],
  });
  if (error) throw new Error(`sign in ${email}: ${error.message}`);
  return client;
}

function anonClient() {
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  console.log(`Testing RLS against ${url}\n`);

  const admin = await signIn("admin@ymv-crm.test");
  const clientA = await signIn("client-a@ymv-crm.test");
  const clientB = await signIn("client-b@ymv-crm.test");
  const anon = anonClient();

  // --- Look up IDs needed for cross-access attempts ---
  const { data: allCustomersAsAdmin } = await admin.from("customers").select("id, email");
  const customerA = allCustomersAsAdmin.find((c) => c.email === "client-a@ymv-crm.test");
  const customerB = allCustomersAsAdmin.find((c) => c.email === "client-b@ymv-crm.test");
  const { data: propsA } = await admin
    .from("properties")
    .select("id")
    .eq("customer_id", customerA.id);
  const { data: propsB } = await admin
    .from("properties")
    .select("id")
    .eq("customer_id", customerB.id);

  // =====================================================================
  // ADMIN: full access
  // =====================================================================
  {
    const { data, error } = await admin.from("customers").select("id");
    record("Admin can read all customers", !error && data.length >= 5, error?.message);
  }
  {
    const { data, error } = await admin.from("properties").select("id");
    record("Admin can read all properties", !error && data.length >= 7, error?.message);
  }
  {
    const { data, error } = await admin.from("property_accounting").select("id");
    record("Admin can read all accounting", !error && data.length > 0, error?.message);
  }
  {
    const { data, error } = await admin
      .from("customers")
      .insert({
        customer_name: "RLS Test Temp Customer",
        phone_1: "+972-50-0000000",
        email: `rls-test-${Date.now()}@example.com`,
        customer_status: "lead",
      })
      .select("id")
      .single();
    record("Admin can create a customer", !error && !!data, error?.message);

    if (data) {
      const { error: updateErr } = await admin
        .from("customers")
        .update({ customer_status: "active" })
        .eq("id", data.id);
      record("Admin can update a customer", !updateErr, updateErr?.message);

      const { error: deleteErr } = await admin.from("customers").delete().eq("id", data.id);
      record("Admin can delete a customer", !deleteErr, deleteErr?.message);
    }
  }

  // =====================================================================
  // CLIENT A: own data only, read-only on business data
  // =====================================================================
  {
    const { data, error } = await clientA.from("customers").select("*");
    record(
      "Client A reads only their own customer profile",
      !error && data.length === 1 && data[0].id === customerA.id,
      error?.message ?? `got ${data?.length} rows`
    );
  }
  {
    const { data, error } = await clientA.from("properties").select("id");
    const ids = (data ?? []).map((r) => r.id).sort();
    const expected = propsA.map((r) => r.id).sort();
    record(
      "Client A reads only their own properties",
      !error && JSON.stringify(ids) === JSON.stringify(expected),
      error?.message
    );
  }
  {
    const { data, error } = await clientA.from("property_accounting").select("id, property_id");
    const foreign = (data ?? []).filter((r) => !propsA.map((p) => p.id).includes(r.property_id));
    record(
      "Client A's accounting rows all belong to their own properties",
      !error && foreign.length === 0,
      error?.message ?? `${foreign.length} foreign rows leaked`
    );
  }
  {
    const { data, error } = await clientA.from("property_requirements").select("customer_id");
    record(
      "Client A reads only their own requirements",
      !error && data.every((r) => r.customer_id === customerA.id),
      error?.message
    );
  }
  {
    // An UPDATE blocked by RLS returns no error and 0 rows affected (not a
    // thrown error) — so the real assertion is that the row is unchanged.
    await clientA.from("properties").update({ property_status: "sold" }).eq("id", propsA[0].id);
    const { data: check } = await admin
      .from("properties")
      .select("property_status")
      .eq("id", propsA[0].id)
      .single();
    record(
      "Client A CANNOT edit their own property (read-only business data)",
      check?.property_status !== "sold",
      `status is now ${check?.property_status}`
    );
  }
  {
    const { error } = await clientA.from("properties").insert({
      customer_id: customerA.id,
      property_address: "Should not be allowed",
    });
    record("Client A CANNOT insert a property", !!error, error ? undefined : "insert succeeded");
  }
  {
    // A DELETE blocked by RLS (no matching USING policy) also silently
    // affects 0 rows rather than erroring — verify the row still exists.
    await clientA.from("customers").delete().eq("id", customerA.id);
    const { data: check } = await admin
      .from("customers")
      .select("id")
      .eq("id", customerA.id)
      .maybeSingle();
    record(
      "Client A CANNOT delete their own customer record",
      !!check,
      check ? undefined : "row was deleted"
    );
  }

  // =====================================================================
  // Cross-client isolation
  // =====================================================================
  {
    const { data, error } = await clientA.from("customers").select("id").eq("id", customerB.id);
    record(
      "Client A cannot read Client B's customer record",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }
  {
    const { data, error } = await clientA
      .from("properties")
      .select("id")
      .eq("id", propsB[0]?.id ?? "00000000-0000-0000-0000-000000000000");
    record(
      "Client A cannot read Client B's properties",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }
  {
    const { data: accB } = await admin
      .from("property_accounting")
      .select("id")
      .eq("property_id", propsB[0]?.id ?? "");
    if (accB && accB[0]) {
      const { data, error } = await clientA
        .from("property_accounting")
        .select("id")
        .eq("id", accB[0].id);
      record(
        "Client A cannot read Client B's accounting",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
  }
  {
    const { data, error } = await clientB.from("customers").select("id").eq("id", customerA.id);
    record(
      "Client B cannot read Client A's customer record",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }
  {
    const { data, error } = await clientB
      .from("properties")
      .select("id")
      .eq("id", propsA[0]?.id ?? "00000000-0000-0000-0000-000000000000");
    record(
      "Client B cannot read Client A's properties",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }

  // =====================================================================
  // Anonymous / unauthenticated
  // =====================================================================
  {
    const { data, error } = await anon.from("customers").select("id");
    record(
      "Unauthenticated request reads zero customers",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }
  {
    const { data, error } = await anon.from("properties").select("id");
    record(
      "Unauthenticated request reads zero properties",
      !error && data.length === 0,
      error?.message ?? `got ${data?.length} rows`
    );
  }

  console.log(`\n${pass} passed, ${fail} failed out of ${pass + fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("RLS test run crashed:", err.message);
  process.exit(1);
});
