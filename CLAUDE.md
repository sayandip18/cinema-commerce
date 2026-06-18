# CLAUDE.md

## Project Overview

This repository contains a cinema commerce platform consisting of:

- Patron Mobile Web App (React Native + Expo)
- Admin Dashboard (React + Vite)
- Digital Twin Simulator (React + Vite)
- Backend API (NestJS)
- Shared packages

The repository is a Turborepo monorepo.

All code generated must follow the conventions in this document.

---

# General Principles

## Architecture

Always prioritize:

1. Readability
2. Maintainability
3. Testability
4. Separation of concerns
5. Explicitness over magic

Avoid clever code.

Prefer boring, predictable solutions.

---

## SOLID Principles

Follow SOLID principles where appropriate.

Avoid god classes.

Avoid utility files containing unrelated functions.

Each module should own its business domain.

---

## TypeScript

Use strict TypeScript.

Never use:

```ts
any;
```

Prefer:

```ts
unknown;
```

or proper typing.

Always create explicit interfaces and types.

Prefer type inference only when obvious.

---

## Naming

Use meaningful names.

Good:

```ts
calculateOrderTotal;
reserveInventory;
getAvailableMenuItems;
```

Bad:

```ts
calc;
handle;
process;
temp;
data;
```

---

# Monorepo Structure

Repository structure:

```text
apps/
  api/
  patron/
  admin/
  digital-twin/

packages/
  shared-types/
  ui/
  config/
```

Rules:

- Business logic belongs in apps.
- Shared types belong in shared-types.
- Shared UI belongs in ui.
- Do not duplicate shared code.

---

# Backend Standards (NestJS)

## NestJS Architecture

Always follow:

```text
module
 ├─ controller
 ├─ service
 ├─ repository
 ├─ dto
 ├─ entities
 └─ tests
```

Example:

```text
orders/
├── orders.controller.ts
├── orders.service.ts
├── orders.repository.ts
├── dto/
├── entities/
└── tests/
```

---

## Controllers

Controllers should:

- Validate requests
- Call services
- Return responses

Controllers should NOT:

- Contain business logic
- Access database directly

Bad:

```ts
@Post()
async create() {
  return this.dataSource.query(...)
}
```

Good:

```ts
@Post()
async create() {
  return this.ordersService.createOrder()
}
```

---

## Services

Services contain business logic.

Examples:

```ts
createOrder();
reserveInventory();
cancelOrder();
```

Services must remain focused.

Avoid services exceeding 500 lines.

Split into domain services when needed.

---

## Repositories

All database access should go through repositories.

Avoid SQL inside services.

Bad:

```ts
await this.dataSource.query(...)
```

Good:

```ts
await this.ordersRepository.findById(id);
```

---

## DTOs

Use DTOs for every request body.

Validate using:

```ts
class-validator
class-transformer
```

Example:

```ts
export class CreateOrderDto {
  @IsUUID()
  userId: string;
}
```

---

## Validation

Always validate input.

Never trust frontend input.

---

## Dependency Injection

Always use NestJS DI.

Never instantiate services manually.

Bad:

```ts
const service = new InventoryService();
```

Good:

```ts
constructor(
  private readonly inventoryService: InventoryService
) {}
```

---

## Error Handling

Throw NestJS exceptions.

Examples:

```ts
NotFoundException;
BadRequestException;
ConflictException;
ForbiddenException;
```

Avoid generic Error.

Bad:

```ts
throw new Error("Invalid");
```

Good:

```ts
throw new BadRequestException("Invalid stock quantity");
```

---

# Database Standards

## PostgreSQL

Use PostgreSQL.

Prefer normalized schemas.

Avoid premature denormalization.

---

## Transactions

Use transactions for critical operations.

Examples:

- Checkout
- Inventory reservation
- Order creation

Inventory updates must be atomic.

Prevent overselling.

---

## Migrations

Always use migrations.

Never modify production schemas manually.

---

# API Standards

## REST

Use RESTful routes.

Good:

```http
GET /menu

POST /orders

GET /orders/:id

PATCH /orders/:id/status
```

Avoid RPC-style routes.

Bad:

```http
POST /createOrder
```

---

## Response Format

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "message": "Item out of stock"
}
```

Keep responses consistent.

---

# React Standards

## Components

Prefer functional components.

Never create class components.

---

## Component Size

If component exceeds ~200 lines:

Consider extracting:

- hooks
- child components
- utilities

---

## Folder Structure

Feature-based organization.

Example:

```text
features/
  orders/
  inventory/
  analytics/
```

Avoid giant component folders.

---

## State Management

Use:

- React Query (TanStack Query)
- Zustand

Avoid Redux unless absolutely necessary.

---

## Data Fetching

Always use React Query.

Avoid fetch logic directly inside components.

Bad:

```ts
useEffect(() => {
 fetch(...)
})
```

Good:

```ts
useQuery(...)
```

---

## Forms

Use:

```text
react-hook-form
zod
```

for all forms.

---

# React Native Standards

## Mobile First

Patron application is mobile-first.

Optimize for phones before desktop.

---

## Styling

Use:

- NativeWind

or

- StyleSheet

Avoid inline styles.

---

## Navigation

Use Expo Router.

---

## Platform Awareness

Keep platform-specific code isolated.

Avoid unnecessary platform branching.

---

# Real-Time Updates

Use WebSockets for:

- Stock updates
- Order status updates

Avoid polling unless specifically required.

---

# Analytics

Analytics must be event-driven.

Order flow should publish events.

Analytics should consume events.

Avoid querying transactional tables directly for analytics.

---

# Digital Twin

The digital twin must:

- Simulate realistic user traffic
- Drive actual APIs
- Measure latency
- Measure stock synchronization lag
- Measure oversell events

Do not hardcode metrics.

Generate metrics from actual execution.

---

# Testing Standards

## Required Tests

Critical business logic must be tested.

Examples:

- Inventory reservation
- Inventory decrement
- Checkout flow
- Analytics aggregation

---

## Test Naming

Good:

```ts
should_prevent_overselling_when_stock_reaches_zero;
```

Bad:

```ts
test1;
```

---

## Coverage Priority

Prioritize:

1. Business logic
2. Concurrency-sensitive logic
3. Analytics calculations

Do not waste effort testing simple DTOs.

---

# Logging

Use structured logging.

Never log:

- passwords
- tokens
- secrets

Log:

- order creation
- inventory changes
- failures

---

# Environment Variables

Never hardcode:

- secrets
- database URLs
- API keys

Always use environment variables.

---

# Git Standards

Commit format:

```text
feat: add inventory reservation service

fix: prevent overselling during checkout

refactor: extract analytics aggregation logic
```

Avoid generic messages.

Bad:

```text
update code
fix stuff
```

---

# Code Generation Rules

Before generating code:

1. Check if similar functionality already exists.
2. Reuse existing patterns.
3. Reuse shared types.
4. Reuse shared UI components.
5. Prefer consistency over novelty.

When uncertain:

Choose the simplest solution that satisfies requirements.
