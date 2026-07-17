// Minimal chainable Supabase query-builder stub shared by integration tests.
// Every chain method (.select/.eq/.in/.order/.limit/...) just returns the
// same builder; the terminal step — `.single()`/`.maybeSingle()`, or simply
// awaiting the builder itself for queries with no terminal call — resolves
// the next queued { data, error } response for that table, in call order.
// This mirrors real supabase-js closely enough for these tests (which only
// assert on inputs passed to `.insert()`/`.upsert()` and on the final
// resolved data/error) without pulling in a real client or hitting the DB.

export type MockResponse<T = unknown> = { data: T; error: unknown } | (() => { data: T; error: unknown });

export interface InsertCall {
  table: string;
  method: "insert" | "upsert";
  payload: unknown;
}

export function createSupabaseMock() {
  const tableQueues: Record<string, MockResponse[]> = {};
  const rpcQueues: Record<string, MockResponse[]> = {};
  const insertCalls: InsertCall[] = [];

  function queue(table: string, response: MockResponse) {
    (tableQueues[table] ??= []).push(response);
  }

  function queueRpc(fn: string, response: MockResponse) {
    (rpcQueues[fn] ??= []).push(response);
  }

  function resolve(response: MockResponse | undefined) {
    const r = response ?? { data: null, error: null };
    return Promise.resolve(typeof r === "function" ? r() : r);
  }

  function makeBuilder(table: string) {
    function next() {
      const q = tableQueues[table];
      return resolve(q && q.length ? q.shift() : undefined);
    }

    const builder: PromiseLike<{ data: unknown; error: unknown }> & Record<string, unknown> = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      in: () => builder,
      is: () => builder,
      order: () => builder,
      limit: () => builder,
      insert: (payload: unknown) => {
        insertCalls.push({ table, method: "insert", payload });
        return builder;
      },
      upsert: (payload: unknown) => {
        insertCalls.push({ table, method: "upsert", payload });
        return builder;
      },
      update: (payload: unknown) => {
        insertCalls.push({ table, method: "insert", payload });
        return builder;
      },
      delete: () => builder,
      single: () => next(),
      maybeSingle: () => next(),
      then: (onFulfilled?: (value: { data: unknown; error: unknown }) => unknown, onRejected?: (reason: unknown) => unknown) =>
        next().then(onFulfilled, onRejected),
    } as unknown as PromiseLike<{ data: unknown; error: unknown }> & Record<string, unknown>;

    return builder;
  }

  const client = {
    from: (table: string) => makeBuilder(table),
    rpc: (fn: string) => {
      const q = rpcQueues[fn];
      return resolve(q && q.length ? q.shift() : undefined);
    },
  };

  return { client, queue, queueRpc, insertCalls };
}
