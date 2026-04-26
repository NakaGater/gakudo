/**
 * Unified Supabase mock for Vitest.
 *
 * Background: tests across the repo had drifted into 3 incompatible
 * mock styles — thenable chain, Proxy chain, hand-rolled chains. Each
 * test file re-implemented the same `select().eq().in().single()`
 * scaffolding. This factory replaces all of them with a single API.
 *
 * Design notes:
 *
 * - The mock is **scenario-driven**: tests describe what tables resolve
 *   to (`{ data, error }`) and the factory wires the chain. Filter
 *   builders (`.eq`, `.in`, `.gte`, `.order`, `.limit`, `.range`,
 *   `.match`, `.not`, …) all return the same chain so call sequences
 *   don't matter.
 *
 * - Chains are **awaitable AND have `.single()` / `.maybeSingle()`** so
 *   tests written against either style work.
 *
 * - Mutations (`.insert`, `.update`, `.upsert`, `.delete`) follow the
 *   same pattern but record their payloads on `spies.mutations` so
 *   tests can assert what was written.
 *
 * - For per-call control, pass a `tableResolver(table, op)` function
 *   instead of fixed `tables`. The resolver is called every time a
 *   chain terminates, so it can return different data for repeated
 *   queries.
 *
 * Coverage scope: this factory targets the patterns used in this repo.
 * It is intentionally not a complete supabase-js shim.
 */
import { vi } from "vitest";

type Resolved = { data: unknown; error: unknown; count?: number | null };

export type Op = "select" | "insert" | "update" | "upsert" | "delete";

export type TableResolver = (table: string, op: Op) => Resolved | undefined;

export type Scenario = {
  /** Fixed per-table response. Applied for any operation against the table. */
  tables?: Record<string, Resolved>;
  /** Dynamic resolver. If it returns undefined, falls through to `tables`. */
  tableResolver?: TableResolver;
  /** RPC responses keyed by function name. */
  rpc?: Record<string, Resolved>;
  /** auth.getUser() response. */
  authUser?: { id: string; email?: string | null } | null;
  /** Storage helpers (used by upload paths). */
  storage?: {
    uploadResult?: { data: unknown; error: unknown };
    publicUrl?: string;
  };
};
export type MutationCall = {
  table: string;
  op: Op;
  payload: unknown;
  /** Second positional arg (e.g. `{ onConflict }` for upserts). */
  options?: unknown;
};

const PASSTHROUGH = [
  "select",
  "eq",
  "neq",
  "in",
  "is",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "match",
  "not",
  "or",
  "filter",
  "order",
  "limit",
  "range",
  "returns",
  "csv",
  "abortSignal",
  "throwOnError",
] as const;

export function createSupabaseMock(scenario: Scenario = {}) {
  const fromCalls: string[] = [];
  const mutations: MutationCall[] = [];
  const rpcCalls: Array<{ name: string; args: unknown }> = [];
  // Per-table FIFO queue. Tests that depend on call order (e.g. one
  // `from("attendances")` returns enter records, the next returns
  // exits) push into this queue; each chain termination dequeues.
  const queues: Record<string, Resolved[]> = {};
  // Per-test RPC overrides — tunable from inside a test without
  // re-creating the whole mock.
  const rpcOverrides: Record<string, Resolved> = {};

  const resolveFor = (table: string, op: Op): Resolved => {
    const dynamic = scenario.tableResolver?.(table, op);
    if (dynamic !== undefined) return dynamic;
    const queue = queues[table];
    if (queue && queue.length > 0) return queue.shift()!;
    return scenario.tables?.[table] ?? { data: [], error: null };
  };

  function buildChain(table: string, op: Op) {
    const resolved = () => resolveFor(table, op);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {};

    for (const m of PASSTHROUGH) {
      chain[m] = vi.fn(() => chain);
    }

    chain.single = vi.fn(() => Promise.resolve(resolved()));
    chain.maybeSingle = vi.fn(() => Promise.resolve(resolved()));

    // Make the chain itself awaitable so `await query` resolves to the
    // same `{ data, error }`. This is what supabase-js does.
    chain.then = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFulfilled: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRejected: any,
    ) => Promise.resolve(resolved()).then(onFulfilled, onRejected);

    return chain;
  }

  const client = {
    from: vi.fn((table: string) => {
      fromCalls.push(table);
      const root = buildChain(table, "select");

      const recordMutation = (op: Op) =>
        vi.fn((payload?: unknown, options?: unknown) => {
          mutations.push({ table, op, payload, options });
          return buildChain(table, op);
        });

      root.insert = recordMutation("insert");
      root.update = recordMutation("update");
      root.upsert = recordMutation("upsert");
      root.delete = recordMutation("delete");

      return root;
    }),
    rpc: vi.fn((name: string, args?: unknown) => {
      rpcCalls.push({ name, args });
      const r = rpcOverrides[name] ?? scenario.rpc?.[name] ?? { data: null, error: null };
      return Promise.resolve(r);
    }),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: scenario.authUser ?? null },
          error: null,
        }),
      ),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: scenario.authUser ? { user: scenario.authUser } : null },
          error: null,
        }),
      ),
    },
    storage: {
      from: vi.fn((_bucket: string) => ({
        upload: vi.fn((_path: string, _body: unknown, _opts?: unknown) =>
          Promise.resolve(
            scenario.storage?.uploadResult ?? { data: { path: "uploaded" }, error: null },
          ),
        ),
        getPublicUrl: vi.fn((_path: string) => ({
          data: { publicUrl: scenario.storage?.publicUrl ?? "https://example/file" },
        })),
        remove: vi.fn((_paths: string[]) => Promise.resolve({ data: null, error: null })),
      })),
    },
  };

  return {
    client,
    spies: {
      fromCalls,
      mutations,
      rpcCalls,
    },
    /**
     * Push a result onto the FIFO queue for `table`. Each subsequent
     * chain terminator (`.single()`, `.maybeSingle()`, or awaiting
     * the chain) dequeues one entry. Useful when the same table is
     * queried multiple times in one test and each call needs a
     * different response.
     */
    enqueue(table: string, resolved: Resolved) {
      (queues[table] ??= []).push(resolved);
    },
    /** Override an RPC response after construction. */
    setRpc(name: string, resolved: Resolved) {
      rpcOverrides[name] = resolved;
    },
  };
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
