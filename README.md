# celo-claw-bot (Polyclaw-for-Celo)

Hackathon project for **Celo: Build Agents for the Real World (Feb 6–15, 2026)**.

This repo is a fast MVP inspired by Polyclaw/Polymarket agents:
- Runs a **Polymarket CLOB trading backend** (NestJS).
- Tracks a single agent’s performance and exposes a **public agent feed** (`/agents/public`) similar to Polyclaw.
- Proves "value on Celo" by periodically moving value into a **cUSD reserve wallet on Celo** (MVP uses a direct cUSD transfer).

> MVP constraints: **single agent**, custodial server wallets, demo-friendly accounting.

---

## Repo layout

- `backend/` — NestJS API + worker/scheduler, Postgres + Redis
- `web/` — frontend (imported; redesign + wiring is in progress)

---

## How it works (current MVP)

### Trading (Polymarket)
- Uses `@polymarket/clob-client` to read markets and (optionally) place orders.
- **Real trading is off by default** (`POLYMARKET_ENABLE_REAL_TRADING=false`).
- When enabled, the backend authenticates via wallet + funder address and can place orders.

### Agent public surface (Polyclaw-like)
- The backend stores an `agents` table (UUID IDs) and exposes:
  - `POST /agents` — create the single deployment agent
  - `GET /agents/public` — list public agents + pagination

### Celo reserve accumulation ("buyback" analog)
- We track "profit" as **net USDC funder balance increase** on Polygon versus the agent baseline `lastTradingBalanceUsdc`.
- `POST /agents/:id/reserve/settle` computes `delta = currentFunderUsdc - baseline`.
- If `delta` exceeds a threshold, we reserve value on Celo.

**Important MVP limitation:** the current reserve implementation does **not** swap/bridge USDC→cUSD.
Instead it performs a **direct cUSD transfer on Celo** from the server’s Celo wallet to the reserve wallet.
So for demos you must pre-fund the server Celo wallet with cUSD.

Reserve transfers are recorded in `reserve_events` and exposed via:
- `GET /agents/:id/reserve-events`

---

## Requirements

- Node.js + pnpm
- Postgres
- Redis

> Docker compose is included in `backend/docker-compose.yml`, but Docker may not be available in all environments.

---

## Running locally

### 1) Start Postgres + Redis
Use either Docker compose (if available) or local services.

### 2) Backend env
Copy and edit:

```bash
cp backend/.env.example backend/.env
```

Minimum for boot:
- `DATABASE_*`, `REDIS_*`

### 3) Install + migrate + start

```bash
cd backend
pnpm i
pnpm migration:run
pnpm start:dev
```

Backend default: http://localhost:3000

---

## Key endpoints

### Agents
- `POST /agents`
- `GET /agents/public?limit=50&offset=0`
- `GET /agents/:id`

### Reserve
- `POST /agents/:id/reserve/settle`
  - body:
    - `minDeltaUsdc` (default `1.0`)
    - `maxAmountCusd` (optional)
    - `reserveAddress` (optional override)
- `GET /agents/:id/reserve-events?limit=50&offset=0`

---

## Demo script (suggested)

1) Create the agent:
```bash
curl -s -X POST http://localhost:3000/agents \
  -H 'content-type: application/json' \
  -d '{"name":"CeloClaw Alpha","strategyType":"crypto","riskLevel":"medium"}' | jq .
```

2) Show the public feed:
```bash
curl -s 'http://localhost:3000/agents/public?limit=10&offset=0' | jq .
```

3) Trigger a reserve settle (requires configured Polymarket USDC balance + configured Celo cUSD wallet):
```bash
curl -s -X POST http://localhost:3000/agents/<AGENT_ID>/reserve/settle \
  -H 'content-type: application/json' \
  -d '{"minDeltaUsdc":"1.0"}' | jq .
```

4) Show reserve events:
```bash
curl -s 'http://localhost:3000/agents/<AGENT_ID>/reserve-events?limit=50&offset=0' | jq .
```

---

## Security notes (MVP)

- **Never commit** `backend/.env`.
- Use a **separate reserve wallet** and keep its private key offline.
- The server wallet is custodial and should be treated as a hot wallet.

---

## Roadmap / not finished

- Swap/bridge flow to convert Polymarket USDC profits into Celo cUSD on-chain.
- ERC-8004 agent identity registration and reputation.
- Frontend redesign + wiring to the new endpoints.
- Automated periodic reserve settlement (cron/queue).
