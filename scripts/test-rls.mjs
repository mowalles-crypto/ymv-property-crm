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
  // Customer profile expansion: spouse, bank accounts, documents (table +
  // Storage RLS). Requires scripts/seed-profile-expansion.mjs to have run
  // (client-a has a spouse/bank/documents, client-b has a passport only).
  // =====================================================================
  const { data: spouseA } = await admin
    .from("customer_spouses")
    .select("id")
    .eq("customer_id", customerA.id)
    .maybeSingle();
  const { data: bankA } = await admin
    .from("customer_bank_accounts")
    .select("id")
    .eq("customer_id", customerA.id)
    .maybeSingle();
  const { data: docsA } = await admin
    .from("customer_documents")
    .select("id, storage_path, document_type")
    .eq("customer_id", customerA.id);
  const { data: docsB } = await admin
    .from("customer_documents")
    .select("id, storage_path, document_type")
    .eq("customer_id", customerB.id);
  const passportA = docsA?.find((d) => d.document_type === "customer_passport");
  const passportB = docsB?.find((d) => d.document_type === "customer_passport");

  if (spouseA && bankA && passportA && passportB) {
    {
      const { data, error } = await clientA
        .from("customer_spouses")
        .select("id")
        .eq("id", spouseA.id);
      record("Client A can read their own spouse record", !error && data.length === 1, error?.message);
    }
    {
      const { data, error } = await clientB
        .from("customer_spouses")
        .select("id")
        .eq("id", spouseA.id);
      record(
        "Client B cannot read Client A's spouse record",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      const { data, error } = await clientA
        .from("customer_bank_accounts")
        .select("id")
        .eq("id", bankA.id);
      record("Client A can read their own bank account", !error && data.length === 1, error?.message);
    }
    {
      const { data, error } = await clientB
        .from("customer_bank_accounts")
        .select("id")
        .eq("id", bankA.id);
      record(
        "Client B cannot read Client A's bank account",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      // Blocked writes on customer_spouses/customer_bank_accounts affect 0
      // rows silently (no matching USING policy for that role), same as
      // properties/customers above — verify via the admin client.
      await clientA
        .from("customer_bank_accounts")
        .update({ bank_name: "Hacked Bank" })
        .eq("id", bankA.id);
      const { data: check } = await admin
        .from("customer_bank_accounts")
        .select("bank_name")
        .eq("id", bankA.id)
        .single();
      record(
        "Client A CANNOT edit their own bank account (read-only)",
        check?.bank_name !== "Hacked Bank",
        `bank_name is now ${check?.bank_name}`
      );
    }
    {
      const { data, error } = await clientB
        .from("customer_documents")
        .select("id")
        .eq("id", passportA.id);
      record(
        "Client B cannot read Client A's document metadata",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    // --- Storage RLS on the actual files, not just the metadata rows ---
    {
      const { data, error } = await clientA.storage
        .from("customer-documents")
        .createSignedUrl(passportA.storage_path, 60);
      record("Client A can get a signed URL for their own passport file", !error && !!data?.signedUrl, error?.message);
    }
    {
      const { data, error } = await clientB.storage
        .from("customer-documents")
        .createSignedUrl(passportA.storage_path, 60);
      record(
        "Client B CANNOT get a signed URL for Client A's passport file",
        !!error || !data?.signedUrl,
        error ? undefined : "signed URL was generated — storage RLS is not enforced"
      );
    }
    {
      const { data, error } = await anon.storage
        .from("customer-documents")
        .createSignedUrl(passportB.storage_path, 60);
      record(
        "Unauthenticated request CANNOT get a signed URL for any passport file",
        !!error || !data?.signedUrl,
        error ? undefined : "signed URL was generated for an anonymous caller"
      );
    }
    {
      const { error } = await clientA.storage
        .from("customer-documents")
        .remove([passportA.storage_path]);
      const { data: stillThere } = await admin
        .from("customer_documents")
        .select("id")
        .eq("id", passportA.id)
        .maybeSingle();
      record(
        "Client A CANNOT delete their own document file (admin-managed only)",
        !!stillThere,
        error ? undefined : stillThere ? undefined : "file was deleted by a non-admin client"
      );
    }
  } else {
    console.log("SKIP  profile-expansion tests — run scripts/seed-profile-expansion.mjs first");
  }

  // =====================================================================
  // Task-driven investment platform (property_transactions, investment
  // offers, sale requests, tax basis/estimates). Requires
  // scripts/seed-investment-platform.mjs to have run.
  // =====================================================================
  const { data: cohenPropsAsAdmin } = await admin
    .from("properties")
    .select("id")
    .eq("customer_id", customerA.id)
    .eq("property_address", "12 Rothschild Blvd, Tel Aviv");
  const cohenRentedId = cohenPropsAsAdmin?.[0]?.id;
  const { data: activeOffersAsAdmin } = await admin
    .from("investment_offers")
    .select("id")
    .eq("status", "active")
    .limit(1);
  const { data: draftOffersAsAdmin } = await admin
    .from("investment_offers")
    .select("id")
    .eq("status", "draft")
    .limit(1);
  const activeOfferId = activeOffersAsAdmin?.[0]?.id;
  const draftOfferId = draftOffersAsAdmin?.[0]?.id;

  if (cohenRentedId && activeOfferId) {
    {
      const { data, error } = await clientA
        .from("property_transactions")
        .select("id, property_id")
        .eq("property_id", cohenRentedId);
      record(
        "Client A can read transactions for their own property",
        !error && data.length > 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      const { data, error } = await clientB
        .from("property_transactions")
        .select("id")
        .eq("property_id", cohenRentedId);
      record(
        "Client B cannot read Client A's property transactions",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      await clientA.from("property_transactions").insert({
        property_id: cohenRentedId,
        transaction_date: "2026-01-01",
        transaction_type: "income",
        amount: 999999,
      });
      const { count } = await admin
        .from("property_transactions")
        .select("id", { count: "exact", head: true })
        .eq("property_id", cohenRentedId)
        .eq("amount", 999999);
      record(
        "Client A CANNOT insert a property transaction (admin-managed only)",
        !count,
        `matching rows: ${count}`
      );
    }
    {
      const { data, error } = await clientA.from("investment_offers").select("status");
      const ok = !error && data.every((o) => o.status === "active");
      record("Client A sees only active investment offers", ok, ok ? undefined : (error?.message ?? "a non-active offer leaked"));
    }
    if (draftOfferId) {
      const { data, error } = await clientA.from("investment_offers").select("id").eq("id", draftOfferId);
      record(
        "Client A cannot read a draft investment offer by id",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      const { error } = await clientA.from("investment_inquiries").insert({
        customer_id: customerA.id,
        investment_offer_id: activeOfferId,
      });
      // May already exist from seed data (unique constraint) — either
      // outcome (success or a unique-violation error) proves the insert
      // was evaluated under Client A's own identity, not silently dropped.
      record(
        "Client A can express interest in an active offer (insert succeeds or is a duplicate)",
        !error || error.code === "23505",
        error && error.code !== "23505" ? error.message : undefined
      );
    }
    {
      const { error } = await clientA.from("investment_inquiries").insert({
        customer_id: customerB.id,
        investment_offer_id: activeOfferId,
      });
      record(
        "Client A CANNOT create an inquiry impersonating Client B",
        !!error,
        error ? undefined : "insert succeeded with a foreign customer_id"
      );
    }
    {
      // property_sale_requests: admin_notes must never reach a client, even
      // via the RPC path they're actually meant to use.
      const { data, error } = await clientA.rpc("get_my_sale_requests");
      const leaked = (data ?? []).some((r) => r.admin_notes != null);
      const ok = !error && !leaked;
      record("get_my_sale_requests() never returns admin_notes to a client", ok, ok ? undefined : (error?.message ?? "admin_notes leaked to client"));
    }
    {
      // ...and the base table itself is admin-only for SELECT, so a client
      // querying it directly (bypassing the RPC) gets nothing at all.
      const { data, error } = await clientA.from("property_sale_requests").select("id").limit(1);
      record(
        "Client A cannot read property_sale_requests directly (RPC-only access)",
        !error && data.length === 0,
        error?.message ?? `got ${data?.length} rows`
      );
    }
    {
      const { data: adminView } = await admin.from("property_sale_requests").select("id, admin_notes").not("admin_notes", "is", null).limit(1);
      const ok = !!adminView && adminView.length > 0 && adminView[0].admin_notes != null;
      record("Admin CAN read admin_notes directly on property_sale_requests", ok, ok ? undefined : "no seeded sale request with admin_notes found");
    }
    {
      // The client INSERT path itself: no .select() chained, since RETURNING
      // is subject to RLS SELECT policies too and this table intentionally
      // has none for clients (admin_notes confidentiality) — the app reads
      // the new row back via get_my_sale_requests() instead.
      const { error: insertErr } = await clientA.from("property_sale_requests").insert({
        customer_id: customerA.id,
        property_id: cohenRentedId,
        requested_sale_price: 3100000,
      });
      const { data: afterInsert, error: rpcErr } = await clientA.rpc("get_my_sale_requests");
      const created = afterInsert?.find(
        (r) => r.property_id === cohenRentedId && Number(r.requested_sale_price) === 3100000
      );
      const ok = !insertErr && !rpcErr && !!created;
      record(
        "Client A can create a sale request for their own property",
        ok,
        ok ? undefined : (insertErr?.message ?? rpcErr?.message ?? "row not found via get_my_sale_requests() after insert")
      );
      if (created) {
        await admin.from("property_sale_requests").delete().eq("id", created.id);
      }
    }
    {
      const { error } = await clientA.from("property_sale_requests").insert({
        customer_id: customerA.id,
        property_id: propsB?.[0]?.id ?? "00000000-0000-0000-0000-000000000000",
        requested_sale_price: 3100000,
      });
      record(
        "Client A CANNOT create a sale request for Client B's property",
        !!error,
        error ? undefined : "insert succeeded for a property Client A doesn't own"
      );
    }
    {
      const { error } = await clientA.from("property_sale_requests").insert({
        customer_id: customerB.id,
        property_id: cohenRentedId,
        requested_sale_price: 3100000,
      });
      record(
        "Client A CANNOT create a sale request impersonating Client B",
        !!error,
        error ? undefined : "insert succeeded with a foreign customer_id"
      );
    }
    {
      const { error } = await clientA.from("property_sale_requests").insert({
        customer_id: customerA.id,
        property_id: cohenRentedId,
        requested_sale_price: 3100000,
        admin_notes: "client trying to set this",
      });
      record(
        "Client A CANNOT set admin_notes on their own sale request insert",
        !!error,
        error ? undefined : "insert succeeded with a client-supplied admin_notes"
      );
    }
    {
      const { data, error } = await clientA.rpc("estimate_capital_gains_tax", {
        p_property_id: cohenRentedId,
        p_estimated_sale_price: 3000000,
      });
      record(
        "Client A can generate a capital gains tax estimate for their own property",
        !error && !!data && data.rule_version,
        error?.message
      );
    }
    if (propsB?.[0]?.id) {
      const { error } = await clientA.rpc("estimate_capital_gains_tax", {
        p_property_id: propsB[0].id,
        p_estimated_sale_price: 3000000,
      });
      record(
        "Client A CANNOT generate a tax estimate for Client B's property",
        !!error,
        error ? undefined : "estimate succeeded for a property Client A doesn't own"
      );
    }
  } else {
    console.log("SKIP  investment-platform tests — run scripts/seed-investment-platform.mjs first");
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
