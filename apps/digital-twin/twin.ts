import { Pool, Dispatcher } from "undici";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────

interface ScenarioFile {
  name: string;
  theatreId?: string;
  showtimeId?: string;
  screenNumber?: string;
  menuItemId?: string;
  menuItemName?: string;
  initialStock: number;
  simulatedPatrons: number;
  concurrency: number;
  quantityPerOrder: number;
  seatPrefix?: string;
}

interface ResolvedScenario {
  name: string;
  theatreId: string;
  theatreName: string;
  showtimeId: string;
  screenNumber: string;
  menuItemId: string;
  menuItemName: string;
  initialStock: number;
  simulatedPatrons: number;
  concurrency: number;
  quantityPerOrder: number;
  seatPrefix: string;
}

interface PatronCredentials {
  userId: string;
  accessToken: string;
}

type OrderOutcome = "confirmed" | "rejected" | "error";

interface PatronResult {
  index: number;
  outcome: OrderOutcome;
  orderLatencyMs: number;
  payLatencyMs: number;
  totalLatencyMs: number;
  orderHttpStatus: number;
  payHttpStatus: number;
  errorMessage?: string;
  completedAt: number;
}

interface StockWatchSample {
  timestamp: number;
  itemPresent: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 15_000;
const SCENARIO_TIMEOUT_MS = 5 * 60_000;

// ─── HTTP helper ────────────────────────────────────────────────────

async function httpJson(
  pool: Pool,
  method: Dispatcher.HttpMethod,
  path: string,
  opts: { body?: unknown; token?: string; signal?: AbortSignal } = {},
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.token) headers["authorization"] = `Bearer ${opts.token}`;

  const { statusCode, body } = await pool.request({
    method,
    path,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    headersTimeout: REQUEST_TIMEOUT_MS,
    bodyTimeout: REQUEST_TIMEOUT_MS,
    signal: opts.signal ?? null,
  });

  const text = await body.text();
  try {
    return { status: statusCode, data: JSON.parse(text) };
  } catch {
    return { status: statusCode, data: text };
  }
}

// ─── Concurrency runner ─────────────────────────────────────────────

async function runConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const index = i;
    const p = fn(items[index]!, index)
      .then((r) => {
        results.push(r);
      })
      .finally(() => {
        executing.delete(p);
      });
    executing.add(p);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// ─── Discovery ──────────────────────────────────────────────────────

async function discoverScenario(
  pool: Pool,
  sf: ScenarioFile,
): Promise<ResolvedScenario> {
  let theatreId = sf.theatreId;
  let theatreName = "";
  let showtimeId = sf.showtimeId;
  let screenNumber = sf.screenNumber ?? "1";
  let menuItemId = sf.menuItemId;
  let menuItemName = sf.menuItemName ?? "";

  if (!theatreId) {
    const { data } = await httpJson(pool, "GET", "/theatres");
    const theatres = (data as Record<string, unknown[]>).data;
    if (!theatres?.length) throw new Error("No theatres found");
    const t = theatres[0] as Record<string, string>;
    theatreId = t.id;
    theatreName = t.name;
    log(`  theatre    ${theatreName} (${theatreId})`);
  }

  if (!showtimeId) {
    const { data } = await httpJson(
      pool,
      "GET",
      `/theatres/${theatreId}/showtimes`,
    );
    const showtimes = (data as Record<string, unknown[]>).data;
    if (!showtimes?.length)
      throw new Error(`No showtimes for theatre ${theatreId}`);
    const s = showtimes[0] as Record<string, string>;
    showtimeId = s.showtimeId ?? s.id;
    screenNumber = s.screen;
    log(`  showtime   ${showtimeId} (screen ${screenNumber})`);
  }

  if (!menuItemId) {
    const { data } = await httpJson(pool, "GET", `/theatres/${theatreId}/menu`);
    const items = (data as Record<string, unknown[]>).data as Array<
      Record<string, string>
    >;
    if (!items?.length)
      throw new Error(`No menu items for theatre ${theatreId}`);

    let found = items[0]!;
    if (sf.menuItemName) {
      const match = items.find((i) =>
        i.name.toLowerCase().includes(sf.menuItemName!.toLowerCase()),
      );
      if (match) found = match;
    }
    menuItemId = found.id;
    menuItemName = found.name;
    log(`  menu item  ${menuItemName} (${menuItemId})`);
  }

  return {
    name: sf.name,
    theatreId: theatreId!,
    theatreName,
    showtimeId: showtimeId!,
    screenNumber,
    menuItemId: menuItemId!,
    menuItemName,
    initialStock: sf.initialStock,
    simulatedPatrons: sf.simulatedPatrons,
    concurrency: sf.concurrency,
    quantityPerOrder: sf.quantityPerOrder,
    seatPrefix: sf.seatPrefix ?? "A",
  };
}

// ─── Auth ───────────────────────────────────────────────────────────

const AGE_GROUPS = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_plus"];
const GENDERS = ["male", "female", "non_binary", "prefer_not_to_say"];
const OTP = "123456";

function phoneForIndex(i: number): string {
  return `70${String(i + 1).padStart(8, "0")}`;
}

interface AuthData {
  user: { id: string };
  tokens: { accessToken: string };
}

async function signupPatron(
  pool: Pool,
  index: number,
): Promise<PatronCredentials | null> {
  const phone = phoneForIndex(index);
  const name = `Patron-${index + 1}`;
  const ageGroup = AGE_GROUPS[index % AGE_GROUPS.length]!;
  const gender = GENDERS[index % GENDERS.length]!;

  try {
    // Try signup flow
    await httpJson(pool, "POST", "/auth/signup/send-otp", {
      body: { phone },
    });
    const verifyRes = await httpJson(pool, "POST", "/auth/signup/verify-otp", {
      body: { phone, otp: OTP },
    });

    if (verifyRes.status >= 200 && verifyRes.status < 300) {
      const signupToken = (
        verifyRes.data as Record<string, Record<string, string>>
      ).data.signupToken;
      const completeRes = await httpJson(
        pool,
        "POST",
        "/auth/signup/complete",
        {
          body: { name, ageGroup, gender },
          token: signupToken,
        },
      );
      if (completeRes.status === 200 || completeRes.status === 201) {
        const d = (completeRes.data as Record<string, AuthData>).data;
        return { userId: d.user.id, accessToken: d.tokens.accessToken };
      }
    }

    // User already exists — sign in instead
    await httpJson(pool, "POST", "/auth/signin/send-otp", {
      body: { phone },
    });
    const signinRes = await httpJson(pool, "POST", "/auth/signin/verify-otp", {
      body: { phone, otp: OTP },
    });
    if (signinRes.status >= 200 && signinRes.status < 300) {
      const d = (signinRes.data as Record<string, AuthData>).data;
      return { userId: d.user.id, accessToken: d.tokens.accessToken };
    }

    log(`  auth failed for patron ${index}: HTTP ${signinRes.status}`);
    return null;
  } catch (e) {
    log(`  auth error for patron ${index}: ${e}`);
    return null;
  }
}

// ─── Inventory ──────────────────────────────────────────────────────

async function refillStock(
  pool: Pool,
  theatreId: string,
  menuItemId: string,
  quantity: number,
): Promise<void> {
  const res = await httpJson(pool, "PUT", "/admin/inventory/bulk", {
    body: { theatreId, items: [{ menuItemId, quantity }] },
  });
  if (res.status >= 400) {
    throw new Error(
      `Refill failed: HTTP ${res.status} ${JSON.stringify(res.data)}`,
    );
  }
}

async function getStockLevel(
  pool: Pool,
  theatreId: string,
  menuItemId: string,
): Promise<number> {
  const res = await httpJson(
    pool,
    "GET",
    `/admin/inventory/${theatreId}/${menuItemId}`,
  );
  if (res.status === 404) return 0;
  return (res.data as Record<string, Record<string, number>>).data.quantity;
}

// ─── Burst execution ────────────────────────────────────────────────

let inFlight = 0;
let maxInFlight = 0;

async function executePatronFlow(
  pool: Pool,
  patron: PatronCredentials,
  index: number,
  scenario: ResolvedScenario,
): Promise<PatronResult> {
  const seat = `${scenario.seatPrefix}-${index + 1}`;
  const totalStart = performance.now();

  inFlight++;
  if (inFlight > maxInFlight) maxInFlight = inFlight;

  let orderStatus = 0;
  let orderId: string | undefined;
  let outcome: OrderOutcome = "error";
  let errorMessage: string | undefined;

  // Place order
  const orderStart = performance.now();
  try {
    const res = await httpJson(pool, "POST", "/orders", {
      token: patron.accessToken,
      body: {
        theatreId: scenario.theatreId,
        showtimeId: scenario.showtimeId,
        screenNumber: scenario.screenNumber,
        seatNumber: seat,
        items: [
          {
            menuItemId: scenario.menuItemId,
            quantity: scenario.quantityPerOrder,
          },
        ],
      },
    });
    orderStatus = res.status;

    if (res.status >= 200 && res.status < 300) {
      outcome = "confirmed";
      orderId = (res.data as Record<string, Record<string, string>>).data.id;
    } else if (res.status === 400) {
      outcome = "rejected";
      const body = res.data as Record<string, unknown>;
      errorMessage = `400: ${body.message ?? JSON.stringify(body)}`;
    } else {
      const body = res.data as Record<string, unknown>;
      errorMessage = `HTTP ${res.status}: ${body.message ?? JSON.stringify(body)}`;
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    errorMessage = `${err.constructor.name}: ${err.message || err.stack?.split("\n")[0] || "unknown"}`;
  }
  const orderEnd = performance.now();

  // Pay if confirmed
  let payStatus = 0;
  const payStart = performance.now();
  if (outcome === "confirmed" && orderId) {
    try {
      const res = await httpJson(pool, "POST", `/orders/${orderId}/pay`, {
        token: patron.accessToken,
      });
      payStatus = res.status;
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : String(e);
    }
  }
  const payEnd = performance.now();
  const totalEnd = performance.now();

  inFlight--;

  return {
    index,
    outcome,
    orderLatencyMs: orderEnd - orderStart,
    payLatencyMs: outcome === "confirmed" ? payEnd - payStart : 0,
    totalLatencyMs: totalEnd - totalStart,
    orderHttpStatus: orderStatus,
    payHttpStatus: payStatus,
    errorMessage,
    completedAt: Date.now(),
  };
}

// ─── Stock-sync watcher ─────────────────────────────────────────────

async function watchStockSync(
  pool: Pool,
  theatreId: string,
  menuItemId: string,
  signal: AbortSignal,
): Promise<StockWatchSample[]> {
  const samples: StockWatchSample[] = [];

  while (!signal.aborted) {
    try {
      const { data } = await httpJson(
        pool,
        "GET",
        `/theatres/${theatreId}/menu`,
      );
      const items = (data as Record<string, unknown[]>).data as Array<
        Record<string, string>
      >;
      samples.push({
        timestamp: Date.now(),
        itemPresent: items.some((i) => i.id === menuItemId),
      });
    } catch {
      // watcher errors are non-fatal
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  log("Pushed menu items");
  return samples;
}

// ─── Helpers ────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.floor(p * sorted.length);
  return sorted[Math.min(i, sorted.length - 1)]!;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function log(msg: string): void {
  process.stdout.write(`[twin] ${msg}\n`);
}

function pad(label: string, width: number): string {
  return label.padEnd(width);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let scenarioPath: string | undefined;
  let baseUrl = "http://localhost:3000";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--scenario" || arg === "-s") {
      scenarioPath = args[++i];
    } else if (arg === "--base-url" || arg === "-u") {
      baseUrl = args[++i]!;
    }
  }

  if (!scenarioPath) {
    console.error(
      "Usage: twin --scenario <path.json> [--base-url http://localhost:3000]",
    );
    process.exit(1);
  }

  const raw = readFileSync(resolve(scenarioPath), "utf-8");
  const sf: ScenarioFile = JSON.parse(raw);

  const scenarioTimer = setTimeout(() => {
    console.error(
      `\nScenario timed out after ${SCENARIO_TIMEOUT_MS / 1000}s — forcing exit.`,
    );
    process.exit(3);
  }, SCENARIO_TIMEOUT_MS);
  scenarioTimer.unref();

  const pool = new Pool(baseUrl, {
    connections: Math.max(sf.concurrency, 64) + 4,
    pipelining: 1,
  });
  const watchPool = new Pool(baseUrl, {
    connections: 4,
    pipelining: 1,
  });

  // ── Phase 1: resolve scenario ──

  log("Resolving scenario...");
  const scenario = await discoverScenario(pool, sf);

  // ── Phase 2: sign up patrons ──

  log(`Signing up ${scenario.simulatedPatrons} patrons...`);
  let signedUp = 0;
  const patronResults = await runConcurrent(
    Array.from({ length: scenario.simulatedPatrons }, (_, i) => i),
    64,
    async (i) => {
      const cred = await signupPatron(pool, i);
      signedUp++;
      if (signedUp % 200 === 0 || signedUp === scenario.simulatedPatrons) {
        log(`  signup progress: ${signedUp}/${scenario.simulatedPatrons}`);
      }
      return cred;
    },
  );
  const patrons = patronResults.filter(
    (p): p is PatronCredentials => p !== null,
  );
  log(`${patrons.length} patrons ready`);

  if (patrons.length === 0) {
    console.error("No patrons authenticated. Aborting.");
    await pool.close();
    process.exit(2);
  }

  // ── Phase 3: refill stock ──

  log(`Refilling stock to ${scenario.initialStock}...`);
  await refillStock(
    pool,
    scenario.theatreId,
    scenario.menuItemId,
    scenario.initialStock,
  );
  const verifiedStock = await getStockLevel(
    pool,
    scenario.theatreId,
    scenario.menuItemId,
  );
  log(`Stock verified: ${verifiedStock}`);

  // ── Phase 4: burst ──

  log(
    `Starting burst — ${patrons.length} patrons, concurrency ${scenario.concurrency}`,
  );

  const watchAbort = new AbortController();
  const watchPromise = watchStockSync(
    watchPool,
    scenario.theatreId,
    scenario.menuItemId,
    watchAbort.signal,
  );

  inFlight = 0;
  maxInFlight = 0;
  let burstCompleted = 0;

  const burstStart = Date.now();
  const burstPerfStart = performance.now();

  const results = await runConcurrent(
    patrons,
    scenario.concurrency,
    async (patron, i) => {
      const r = await executePatronFlow(pool, patron, i, scenario);
      burstCompleted++;
      if (burstCompleted % 50 === 0 || burstCompleted === patrons.length) {
        log(`  burst progress: ${burstCompleted}/${patrons.length}`);
      }
      return r;
    },
  );

  const burstDurationMs = performance.now() - burstPerfStart;

  log("Waiting for payments to settle...");
  await new Promise((r) => setTimeout(r, 2000));

  watchAbort.abort();
  const watchSamples = await watchPromise;

  // ── Phase 5: final stock ──

  const finalStock = await getStockLevel(
    pool,
    scenario.theatreId,
    scenario.menuItemId,
  );

  // ── Phase 6: compute results ──

  const confirmed = results.filter((r) => r.outcome === "confirmed");
  const rejected = results.filter((r) => r.outcome === "rejected");
  const errors = results.filter((r) => r.outcome === "error");

  const orderLatencies = results
    .map((r) => r.orderLatencyMs)
    .sort((a, b) => a - b);
  const totalLatencies = confirmed
    .map((r) => r.totalLatencyMs)
    .sort((a, b) => a - b);

  // peak req/s
  const secondBuckets = new Map<number, number>();
  for (const r of results) {
    const sec = Math.floor((r.completedAt - burstStart) / 1000);
    secondBuckets.set(sec, (secondBuckets.get(sec) ?? 0) + 1);
  }
  let peakReqPerSec = 0;
  let peakSecond = 0;
  for (const [sec, count] of secondBuckets) {
    if (count > peakReqPerSec) {
      peakReqPerSec = count;
      peakSecond = sec;
    }
  }

  // stock-sync lag
  const sortedConfirmed = [...confirmed].sort(
    (a, b) => a.completedAt - b.completedAt,
  );
  const stockDepletedAt =
    scenario.initialStock <= sortedConfirmed.length
      ? sortedConfirmed[scenario.initialStock - 1]!.completedAt
      : null;
  const firstSoldOut = watchSamples.find((s) => !s.itemPresent);
  const stockSyncLagMs =
    stockDepletedAt && firstSoldOut
      ? Math.max(0, firstSoldOut.timestamp - stockDepletedAt)
      : null;

  const oversellCount = Math.max(0, confirmed.length - scenario.initialStock);

  // ── Phase 7: print ──

  const W = 23;
  const bar = "═".repeat(64);
  const thin = "─".repeat(64);

  console.log(`\n${bar}`);
  console.log(
    `SCENARIO: ${scenario.name}  (stock=${scenario.initialStock}, patrons=${patrons.length})`,
  );
  console.log(bar);
  console.log(
    `  ${pad("theatre", W)} ${scenario.theatreName || scenario.theatreId}`,
  );
  console.log(
    `  ${pad("menu item", W)} ${scenario.menuItemName || scenario.menuItemId}`,
  );
  console.log(
    `  ${pad("burst duration", W)} ${(burstDurationMs / 1000).toFixed(2)} s`,
  );
  console.log(
    `  ${pad("peak arrival rate", W)} ${fmt(peakReqPerSec)} req/s   @ t=${peakSecond}s`,
  );
  console.log(thin);
  console.log(`  ${pad("orders attempted", W)} ${fmt(patrons.length)}`);
  console.log(`  ${pad("confirmed sold", W)} ${fmt(confirmed.length)}`);
  console.log(
    `  ${pad("rejected (sold out)", W)} ${fmt(rejected.length)}${rejected.length > 0 ? "   ✓ correct degradation" : ""}`,
  );
  console.log(`  ${pad("errors (5xx/timeout)", W)} ${fmt(errors.length)}`);
  console.log(
    `  ${pad("OVERSELL", W)} ${oversellCount}   ${oversellCount === 0 ? "✓" : "✗ DETECTED"}`,
  );
  console.log(thin);
  console.log(
    `  ${pad("p50 order latency", W)} ${percentile(orderLatencies, 0.5).toFixed(0)} ms`,
  );
  console.log(
    `  ${pad("p95 order latency", W)} ${percentile(orderLatencies, 0.95).toFixed(0)} ms`,
  );
  console.log(
    `  ${pad("p99 order latency", W)} ${percentile(orderLatencies, 0.99).toFixed(0)} ms`,
  );
  if (totalLatencies.length > 0) {
    console.log(
      `  ${pad("p95 total (ord+pay)", W)} ${percentile(totalLatencies, 0.95).toFixed(0)} ms`,
    );
    console.log(
      `  ${pad("p99 total (ord+pay)", W)} ${percentile(totalLatencies, 0.99).toFixed(0)} ms`,
    );
  }
  console.log(`  ${pad("max in-flight", W)} ${fmt(maxInFlight)}`);
  if (stockSyncLagMs !== null) {
    console.log(
      `  ${pad("stock-sync lag", W)} ${(stockSyncLagMs / 1000).toFixed(1)} s`,
    );
  }
  console.log(`  ${pad("final stock", W)} ${finalStock}`);
  console.log(bar);

  if (rejected.length > 0) {
    console.log("\nSample rejections (first 3):");
    for (const r of rejected.slice(0, 3)) {
      console.log(`  patron #${r.index}: ${r.errorMessage}`);
    }
  }

  if (errors.length > 0) {
    console.log("\nSample errors (first 5):");
    for (const e of errors.slice(0, 5)) {
      console.log(`  patron #${e.index}: ${e.errorMessage}`);
    }
  }

  await pool.close();
  await watchPool.close();
  process.exit(oversellCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(2);
});
