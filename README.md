# REAL Capital

Premium AI trading intelligence dashboard for the TON Momentum Hunter agent.

**Status:** Paper trading simulation · Experimental system · v0.1.1

---

## Quick start

```bash
cp .env.example .env.local
# Fill in ADMIN_PASSWORD_HASH and SESSION_SECRET (see below)
npm install
npm run build
npm start          # production on port 4012
```

Using PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
```

Development:
```bash
npm run dev        # hot-reload on port 4012
npm run typecheck  # run TypeScript check without building
npm run lint       # ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MEMORY_JSON_PATH` | Yes | Absolute path to agent's `memory.json` (read-only) |
| `LIVE_DATA` | No | Set `0` to force mock data (default: `1`) |
| `ADMIN_PASSWORD_HASH` | Yes | SHA-256 hex hash of admin password |
| `SESSION_SECRET` | Yes | 64-char random hex for session encryption |
| `NEXT_PUBLIC_APP_URL` | No | Public hostname, no trailing slash |

**Generate credentials:**

```bash
# 1. Admin password hash (SHA-256 of your chosen password)
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('YOUR_STRONG_PASSWORD').digest('hex'))"

# 2. Session secret (random 32 bytes as hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Production startup validation:**
The app refuses to start in `NODE_ENV=production` if `ADMIN_PASSWORD_HASH` or
`SESSION_SECRET` are missing or placeholder values. In development, insecure
fallbacks are used with a console warning.

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Investor-facing frontpage |
| `/dashboard` | Public | Live portfolio summary (read-only) |
| `/admin/login` | Public | Admin authentication |
| `/admin` | Admin | Full KPI overview + open positions + recent trades |
| `/admin/trades` | Admin | Complete trade history with win/loss filter |
| `/admin/decisions` | Admin | AI decision audit log + missed opportunities |
| `/admin/risk` | Admin | Capital protection events, blocked exits, risk parameters |
| `/api/status` | Public | Read-only portfolio summary (rate-limited 30 req/10s) |
| `/api/health` | Public | App health: version, uptime, dataSourceConnected |
| `/api/admin/portfolio` | Admin | Full data payload (requires session) |
| `/api/auth/login` | Public | POST — rate-limited to 5 req/min per IP |
| `/api/auth/logout` | Admin | POST — destroys session cookie |

---

## Security

- All `/admin/*` routes protected by middleware — unauthenticated requests
  redirect to `/admin/login`
- Session cookie: `httpOnly`, `sameSite=lax`, `secure=true` in production, 8h TTL
- Login: 5 req/min rate limit per IP, 500ms artificial delay on failure,
  constant-time comparison using `crypto.timingSafeEqual`
- Security headers on all routes: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `Strict-Transport-Security`
- Admin password stored as SHA-256 hash in env — never in code or git

---

## Data source schema

The data adapter (`lib/adapter.ts`) reads `memory.json` from the agent.
**Read-only — never writes to memory.json or modifies trading logic.**

```
memory.json
├── portfolio.{starting_capital_ton, cash_ton, total_value_ton,
│             realized_pnl_ton, unrealized_pnl_ton, peak_value_ton,
│             max_drawdown_percent}
├── open_positions[].{id, symbol, dex, entry_price_ton, cost_ton,
│                    current_value_ton, entry_signals[], entry_decision}
├── closed_trades[].{id, symbol, dex, entry_price_ton, exit_price_ton,
│                   cost_ton, proceeds_ton, pnl_ton, pnl_percent,
│                   hold_minutes, exit_reason, entry_decision}
├── ai_decisions[].{ts, symbol, decision.{action, confidence, momentum_score,
│                  rug_risk_score, reasoning, source}, context.{price_ton,
│                  liquidity_ton}}
├── missed_candidates[].{symbol, pool_id, primary_reason, max_move_pct,
│                       rejection_correct, reject_count}
├── blocked_exits[].{ts, symbol, position_id, age_minutes, min_hold_minutes,
│                   exit_confidence, rug_risk_score, ai_reasoning}
└── protection.{mode, cp_active, cp_since, cp_triggers[], daily_stop,
                daily_stop_reason, cooldown_until, cooldown_reason}
```

To replace the data source: implement `readFullDashboard()` in `lib/adapter.ts`
returning `FullDashboard`. The `checkDataSource()` export feeds the health endpoint.

---

## Nginx reverse proxy

**Status: live.** DNS, SSL, and nginx are fully configured and running.

This server uses a stream-level SNI router on port 443 (see `/etc/nginx/nginx.conf`).
All vhosts must listen on an internal loopback port — **not** directly on `443 ssl`.
`realcapital.no` is routed to `127.0.0.1:4431`.

`/etc/nginx/sites-available/realcapital.no`:

```nginx
# TLS terminated here via stream SNI router (port 4431)
server {
    listen 127.0.0.1:4431 ssl;
    server_name realcapital.no www.realcapital.no;

    ssl_certificate     /etc/letsencrypt/live/realcapital.no/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/realcapital.no/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass         http://127.0.0.1:4012;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name realcapital.no www.realcapital.no;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

Stream SNI map entry in `/etc/nginx/nginx.conf`:
```nginx
realcapital.no      127.0.0.1:4431;
www.realcapital.no  127.0.0.1:4431;
```

> **Important:** Do NOT use `listen 443 ssl` in this vhost — port 443 is owned
> by the stream block. Adding it will conflict with the SNI router and break all
> HTTPS on the server.

SSL certificate is managed by certbot and auto-renews. Expires 2026-09-19.
To renew manually: `sudo certbot renew`

---

## Rotating admin credentials

```bash
# 1. Generate new password hash
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('YOUR_NEW_PASSWORD').digest('hex'))"

# 2. Update .env.local
nano /home/ubuntu/real-capital/.env.local
# Replace ADMIN_PASSWORD_HASH with the new hash

# 3. Rebuild and restart
npm run build
pm2 restart real-capital
```

---

## Deployment notes

- Port `4012` (set in `package.json` scripts and `ecosystem.config.js`)
- `memory.json` must be readable by the process user (`ubuntu`)
- `.env.local` is gitignored — never commit secrets
- The app never writes to `memory.json` or touches any trading logic
- Check health: `curl http://localhost:4012/api/health`

---

## Disclaimer

Experimental AI trading system. Paper trading simulation only.  
**Historical performance is not a guarantee of future results.**  
Not financial advice.
