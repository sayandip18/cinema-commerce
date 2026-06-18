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
