# REAL Capital

Premium AI trading intelligence dashboard for the TON Momentum Hunter agent.

**Status:** Paper trading simulation · Experimental system

---

## Quick start

```bash
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)
npm install
npm run build
npm start          # production on port 4012
# or
npm run dev        # dev server on port 4012
```

Using PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MEMORY_JSON_PATH` | Yes | Absolute path to agent's `memory.json` |
| `LIVE_DATA` | No | Set to `0` to force mock data (default: `1`) |
| `ADMIN_PASSWORD_HASH` | Yes | SHA-256 hash of admin password |
| `SESSION_SECRET` | Yes | 32+ char random string for session encryption |
| `NEXT_PUBLIC_APP_URL` | No | Public hostname (for meta tags) |

**Generating credentials:**
```bash
# Password hash (SHA-256)
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('yourpassword').digest('hex'))"

# Session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Investor-facing frontpage |
| `/dashboard` | Public | Live portfolio summary (read-only) |
| `/admin/login` | Public | Admin authentication |
| `/admin` | Admin | Full dashboard (all KPIs + positions + recent trades) |
| `/admin/trades` | Admin | Complete trade history with filtering |
| `/admin/decisions` | Admin | AI decision log + missed opportunities |
| `/admin/risk` | Admin | Protection events, blocked exits, risk parameters |
| `/api/status` | Public | Read-only portfolio summary (rate-limited) |
| `/api/admin/portfolio` | Admin | Full data payload |
| `/api/auth/login` | Public | POST — rate-limited to 5/min per IP |
| `/api/auth/logout` | Admin | POST — destroys session |

---

## Data source schema

The data adapter (`lib/adapter.ts`) reads `memory.json` from the TON Momentum Hunter agent. All reads are read-only — no writes ever occur.

**Key fields consumed from `memory.json`:**

```
memory.json
├── portfolio
│   ├── starting_capital_ton       — starting balance
│   ├── cash_ton                   — current cash
│   ├── total_value_ton            — total portfolio value
│   ├── realized_pnl_ton           — closed trade P&L
│   ├── unrealized_pnl_ton         — open position P&L
│   ├── peak_value_ton             — all-time high value
│   └── max_drawdown_percent       — max drawdown from peak
│
├── open_positions[]               — currently held tokens
│   ├── id, symbol, dex
│   ├── entry_price_ton, cost_ton
│   ├── current_value_ton          — live mark-to-market
│   ├── entry_signals[]            — signals that triggered entry
│   └── entry_decision             — full AI decision object
│
├── closed_trades[]                — trade history
│   ├── id, symbol, dex
│   ├── entry_price_ton, exit_price_ton
│   ├── cost_ton, proceeds_ton, pnl_ton, pnl_percent
│   ├── hold_minutes, exit_reason
│   └── entry_decision             — AI decision with confidence/scores/reasoning
│
├── ai_decisions[]                 — every scanner evaluation
│   ├── ts, symbol
│   ├── decision.action            — BUY | SELL | HOLD
│   ├── decision.confidence        — 0.0 – 1.0
│   ├── decision.momentum_score    — 0 – 100
│   ├── decision.rug_risk_score    — 0 – 100
│   ├── decision.reasoning         — full AI text
│   └── context.{price_ton, liquidity_ton, metrics}
│
├── missed_candidates[]            — rejected entries with post-hoc outcomes
│   ├── symbol, pool_id
│   ├── primary_reason             — rejection reason text
│   ├── max_move_pct               — how much it moved after rejection
│   └── rejection_correct          — true if rejection was the right call
│
├── blocked_exits[]                — premature exit attempts blocked by min hold
│   ├── ts, symbol, position_id
│   ├── age_minutes, min_hold_minutes
│   ├── exit_confidence, rug_risk_score
│   └── ai_reasoning               — AI text explaining the exit intent
│
└── protection
    ├── mode                       — NORMAL | CAPITAL_PROTECTION
    ├── cp_active, cp_since, cp_triggers[]
    ├── daily_stop, daily_stop_reason
    └── cooldown_until, cooldown_reason
```

To connect a different data source: implement `readFullDashboard()` in `lib/adapter.ts` returning `FullDashboard`.

---

## Deployment notes

- Port `4012` (configurable in `package.json` scripts and `ecosystem.config.js`)
- **Do not** connect `realcapital.no` DNS until the app is production-ready
- `memory.json` must be readable by the process user
- `.env.local` is gitignored — never commit secrets
- The app never writes to `memory.json` or modifies any trading logic

---

## Disclaimer

Experimental AI trading system. Paper trading simulation only.
Historical performance is not a guarantee of future results.
Not financial advice.
