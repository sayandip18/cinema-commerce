# Cinema commerce

This platform consists of four primary applications, each with a clearly defined responsibility.

---

## 1. Patron App (`apps/patron`)

### Purpose

Customer-facing mobile web application used by moviegoers to order food and beverages from their seats.

### Features

- Browse live stock-aware menu
- Add items to cart
- Checkout (mock payment)
- Track order status in real time
- Receive stock availability updates

### Primary Users

- Cinema patrons
- Moviegoers

### Integrations

- NestJS API
- WebSocket Gateway

---

## 2. Admin App (`apps/admin`)

### Purpose

Operational dashboard used by cinema staff and managers to manage inventory, orders, and business performance.

### Features

- Menu management
- Inventory management
- Stock updates
- Order monitoring
- Analytics dashboard

### Primary Users

- Cinema staff
- Operations managers
- Administrators

### Integrations

- NestJS API

---

## 3. API (`apps/api`)

### Purpose

Central backend responsible for business logic, inventory consistency, order processing, analytics event publishing, and real-time communication.

### Responsibilities

#### Catalog Domain

- Menu management
- Product information
- Availability

#### Inventory Domain

- Stock tracking
- Atomic stock reservation
- Oversell prevention

#### Orders Domain

- Order creation
- Order lifecycle management
- Checkout processing

#### Analytics Domain

- Event consumption
- Metric aggregation
- Reporting APIs

#### Real-Time Domain

- Stock update broadcasting
- Order status updates

### Integrations

- PostgreSQL
- Redis
- WebSocket Gateway

---

## 4. Digital Twin (`apps/digital-twin`)

### Purpose

Simulation platform used to validate system behavior under realistic cinema traffic conditions.

The Digital Twin generates synthetic demand and drives actual backend APIs to measure performance, reliability, and scalability.

### Features

#### Traffic Simulation

- Virtual customers
- Audience profiles
- Showtime schedules
- Intermission traffic spikes

#### System Validation

- Drive real ordering APIs
- Drive real inventory APIs
- Simulate concurrent checkout scenarios

#### Metrics Collection

- P95 latency
- Throughput
- Queue depth
- Oversell events
- Stock synchronization lag
- Order success rate

### Primary Users

- Engineering team
- Operations team

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts `patron-db` (Postgres 16) and `patron-redis` (Redis 7).

### 2. Start the API

```bash
cd apps/api
cp .env.example .env   # already populated with dev defaults
pnpm start:dev
```

The database tables are created automatically on first run.

### 3. Seed the database

```bash
cd apps/api
pnpm seed
```

This inserts 5 theatres, 7 movies, and 12 showtimes. The script is idempotent — it skips seeding if data already exists.

### 4. Start the Admin dashboard

```bash
cd apps/admin
pnpm dev
```

Opens at http://localhost:5173.

### 5. Start the Patron app

```bash
cd apps/patron
pnpm start
```

Press `w` for web, `a` for Android, or `i` for iOS.

### 6. Run the Digital Twin

The digital twin is a standalone Node.js CLI that hammers the running API over HTTP, simulating a burst of cinema patrons ordering concessions. It signs up virtual users, refills inventory to a known level, fires concurrent orders + payments, and prints a latency/correctness readout.

#### Prerequisites

The API, Postgres, and Redis must be running (steps 1–3 above). The database must be seeded.

#### Install dependencies

```bash
cd apps/digital-twin
pnpm install
```

#### Run a scenario

```bash
cd apps/digital-twin
npx tsx twin.ts --scenario scenarios/popcorn-meltdown.json
npx tsx twin.ts --scenario scenarios/popcorn-meltdown-2500.json
```

To target a different API host:

```bash
npx tsx twin.ts --scenario scenarios/popcorn-meltdown.json --base-url http://localhost:3000
```

#### Scenario file format

Scenarios are JSON files in `apps/digital-twin/scenarios/`. Two modes are supported:

**Discover mode** — the twin auto-discovers IDs by querying the API:

```json
{
  "name": "popcorn-meltdown",
  "menuItemName": "Classic Popcorn",
  "initialStock": 200,
  "simulatedPatrons": 500,
  "concurrency": 128,
  "quantityPerOrder": 1,
  "seatPrefix": "A"
}
```

**Explicit mode** — provide UUIDs directly (skip discovery):

```json
{
  "name": "popcorn-meltdown",
  "theatreId": "<uuid>",
  "showtimeId": "<uuid>",
  "screenNumber": "3",
  "menuItemId": "<uuid>",
  "initialStock": 200,
  "simulatedPatrons": 2500,
  "concurrency": 512,
  "quantityPerOrder": 1,
  "seatPrefix": "A"
}
```

| Field              | Required | Description                                                             |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| `name`             | Yes      | Scenario label shown in the report                                      |
| `theatreId`        | No       | Theatre UUID (discovered from `GET /theatres` if omitted)               |
| `showtimeId`       | No       | Showtime UUID (discovered from theatre showtimes if omitted)            |
| `screenNumber`     | No       | Screen number (discovered with showtime if omitted)                     |
| `menuItemId`       | No       | Menu item UUID (discovered from theatre menu if omitted)                |
| `menuItemName`     | No       | Substring match to find menu item in discover mode                      |
| `initialStock`     | Yes      | Stock level set before the burst via the admin refill API               |
| `simulatedPatrons` | Yes      | Total virtual users that will place orders                              |
| `concurrency`      | Yes      | Max in-flight requests during the burst                                 |
| `quantityPerOrder` | Yes      | Units of the menu item per order                                        |
| `seatPrefix`       | No       | Seat label prefix (default: `A`); seats generated as `A-1`, `A-2`, etc. |

#### Sample output

```
════════════════════════════════════════════════════════════════
SCENARIO: popcorn-meltdown  (stock=200, patrons=500)
════════════════════════════════════════════════════════════════
  theatre                PVR INOX Nexus
  menu item              Classic Popcorn
  burst duration         4.21 s
  peak arrival rate      312 req/s   @ t=1s
────────────────────────────────────────────────────────────────
  orders attempted       500
  confirmed sold         200
  rejected (sold out)    300   ✓ correct degradation
  errors (5xx/timeout)   0
  OVERSELL               0   ✓
────────────────────────────────────────────────────────────────
  p50 order latency      45 ms
  p95 order latency      340 ms
  p99 order latency      910 ms
  p95 total (ord+pay)    520 ms
  p99 total (ord+pay)    1100 ms
  max in-flight          128
  stock-sync lag         1.2 s
  final stock            0
════════════════════════════════════════════════════════════════
```

The process exits with code `0` if no oversell is detected, or `1` if oversell occurred.
