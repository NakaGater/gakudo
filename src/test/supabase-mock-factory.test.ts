import { describe, expect, it } from "vitest";
import { createSupabaseMock } from "./supabase-mock-factory";

describe("createSupabaseMock", () => {
  it("resolves a select chain to fixed table data", async () => {
    const { client } = createSupabaseMock({
      tables: { children: { data: [{ id: "c1", name: "太郎" }], error: null } },
    });

    const { data, error } = await client.from("children").select("id, name").eq("grade", 1);

    expect(error).toBeNull();
    expect(data).toEqual([{ id: "c1", name: "太郎" }]);
  });

  it("supports .single() shape", async () => {
    const { client } = createSupabaseMock({
      tables: { profiles: { data: { id: "u1", role: "admin" }, error: null } },
    });

    const { data } = await client.from("profiles").select("*").eq("id", "u1").single();

    expect(data).toEqual({ id: "u1", role: "admin" });
  });

  it("records insert payloads on spies.mutations", async () => {
    const { client, spies } = createSupabaseMock({
      tables: { inquiries: { data: [{ id: "new" }], error: null } },
    });

    await client.from("inquiries").insert({ name: "山田", email: "a@b.com" });

    expect(spies.mutations).toEqual([
      {
        table: "inquiries",
        op: "insert",
        payload: { name: "山田", email: "a@b.com" },
        options: undefined,
      },
    ]);
  });

  it("captures the second positional arg (e.g. upsert onConflict)", async () => {
    const { client, spies } = createSupabaseMock();

    await client
      .from("monthly_bills")
      .upsert({ child_id: "c1", year_month: "2025-01" }, { onConflict: "child_id,year_month" });

    expect(spies.mutations[0]).toEqual({
      table: "monthly_bills",
      op: "upsert",
      payload: { child_id: "c1", year_month: "2025-01" },
      options: { onConflict: "child_id,year_month" },
    });
  });

  it("dynamic tableResolver overrides fixed tables", async () => {
    let count = 0;
    const { client } = createSupabaseMock({
      tables: { hits: { data: [], error: null } },
      tableResolver: (table) => {
        if (table !== "hits") return undefined;
        count += 1;
        return { data: [{ n: count }], error: null };
      },
    });

    const a = await client.from("hits").select("*");
    const b = await client.from("hits").select("*");

    expect(a.data).toEqual([{ n: 1 }]);
    expect(b.data).toEqual([{ n: 2 }]);
  });

  it("rpc returns the configured response and records the call", async () => {
    const { client, spies } = createSupabaseMock({
      rpc: { get_attendance_summary: { data: { entered: 5 }, error: null } },
    });

    const { data } = await client.rpc("get_attendance_summary", { foo: 1 });

    expect(data).toEqual({ entered: 5 });
    expect(spies.rpcCalls).toEqual([{ name: "get_attendance_summary", args: { foo: 1 } }]);
  });

  it("returns empty default when no scenario for table", async () => {
    const { client } = createSupabaseMock();
    const { data, error } = await client.from("anything").select("*");
    expect(data).toEqual([]);
    expect(error).toBeNull();
  });

  it("authUser propagates to auth.getUser()", async () => {
    const { client } = createSupabaseMock({
      authUser: { id: "u1", email: "a@b.com" },
    });
    const { data } = await client.auth.getUser();
    expect(data.user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("FIFO enqueue() drains in order across repeated from() calls", async () => {
    const mock = createSupabaseMock();
    mock.enqueue("attendances", { data: [{ id: 1 }], error: null });
    mock.enqueue("attendances", { data: [{ id: 2 }], error: null });

    const a = await mock.client.from("attendances").select("*");
    const b = await mock.client.from("attendances").select("*");
    const c = await mock.client.from("attendances").select("*");

    expect(a.data).toEqual([{ id: 1 }]);
    expect(b.data).toEqual([{ id: 2 }]);
    // Queue is empty → falls through to default
    expect(c.data).toEqual([]);
  });

  it("storage upload returns configured result", async () => {
    const { client } = createSupabaseMock({
      storage: { publicUrl: "https://cdn/x.png" },
    });
    const { data: up } = await client.storage.from("photos").upload("x.png", new Blob());
    expect(up).toEqual({ path: "uploaded" });
    const { data: url } = client.storage.from("photos").getPublicUrl("x.png");
    expect(url.publicUrl).toBe("https://cdn/x.png");
  });
});
