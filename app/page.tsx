import Link from "next/link";

export default function FrontPage() {
  return (
    <>
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="topnav">
        <div className="container">
          <div className="topnav-brand">
            <span className="brand-dot" />
            REAL Capital
          </div>
          <ul className="topnav-links">
            <li><a href="#features">Strategy</a></li>
            <li><a href="#performance">Performance</a></li>
            <li><a href="#risk">Risk</a></li>
            <li>
              <Link href="/dashboard" className="btn btn-outline" style={{ padding: "6px 14px", fontSize: ".8rem" }}>
                Live Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="hero">
        <p className="hero-eyebrow">TON Momentum Hunter · Paper Trading Simulation</p>
        <h1 className="hero-title">
          REAL<br /><span>Capital</span>
        </h1>
        <p className="hero-subtitle">
          Autonomous AI trading intelligence for TON markets.
          Systematic, risk-first capital management powered by Claude.
        </p>
        <div className="hero-cta">
          <Link href="/dashboard" className="btn btn-gold">
            View Live Dashboard
          </Link>
          <a href="#features" className="btn btn-outline">
            How it works
          </a>
        </div>

        <div className="hero-meta">
          <div className="hero-stat">
            <div className="hero-stat-value text-gold">AI</div>
            <div className="hero-stat-label">Decision engine</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">TON</div>
            <div className="hero-stat-label">Native network</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value text-gold">24/7</div>
            <div className="hero-stat-label">Autonomous operation</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">0</div>
            <div className="hero-stat-label">Human emotions</div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="text-center">
            <p className="hero-eyebrow">Strategy</p>
            <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, marginBottom: 12 }}>
              Built for systematic execution
            </h2>
            <p className="text-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
              Every trade decision is scored, reasoned, and logged. No guessing. No emotion.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">◈</div>
              <div className="feature-title">Live AI Treasury</div>
              <div className="feature-desc">
                Real-time capital tracking across all positions. Every satoshi accounted for
                with full entry/exit audit trail.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">TON Momentum Hunter</div>
              <div className="feature-desc">
                Scans DeDust and StonFi continuously. Identifies volume spikes, buy
                imbalances, and liquidity growth before the crowd.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡</div>
              <div className="feature-title">Risk-First Capital Protection</div>
              <div className="feature-desc">
                Automatic capital protection mode triggers on drawdown thresholds.
                Hard stop-loss, max position size, and rug-risk scoring on every entry.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Transparent Trading History</div>
              <div className="feature-desc">
                Every trade logged with full AI reasoning, confidence score, entry signals,
                hold time, and outcome. Nothing hidden.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-title">AI Decision Audit</div>
              <div className="feature-desc">
                Each BUY/SELL/HOLD decision includes momentum score, rug risk assessment,
                liquidity check, and written reasoning from the AI engine.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <div className="feature-title">Performance Analytics</div>
              <div className="feature-desc">
                Win rate, realized P&amp;L, max drawdown, ROI, and missed opportunity analysis.
                Continuously improving through real market feedback.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Performance ──────────────────────────────────────────────────────── */}
      <section id="performance" style={{ padding: "80px 0", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <p className="hero-eyebrow">Transparency</p>
            <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, marginBottom: 12 }}>
              Live performance data
            </h2>
            <p className="text-muted" style={{ maxWidth: 480, margin: "0 auto" }}>
              All figures are updated continuously from the live agent. Paper trading simulation.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "Starting Capital", value: "15.0 TON", sub: "paper simulation" },
              { label: "Total Trades", value: "Live", sub: "see dashboard" },
              { label: "Decision Engine", value: "Claude AI", sub: "real-time scoring" },
              { label: "Networks", value: "DeDust + StonFi", sub: "DEX coverage" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ textAlign: "center" }}>
                <div className="card-title">{s.label}</div>
                <div className="card-value" style={{ fontSize: "1.2rem" }}>{s.value}</div>
                <div className="card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/dashboard" className="btn btn-gold">
              View Full Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Risk section ─────────────────────────────────────────────────────── */}
      <section id="risk" style={{ padding: "80px 0", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <p className="hero-eyebrow">Risk Management</p>
              <h2 style={{ fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 800, marginBottom: 16 }}>
                Capital protection is not optional
              </h2>
              <p className="text-muted" style={{ lineHeight: 1.8, marginBottom: 20 }}>
                The agent enforces hard limits at every layer. Capital protection mode activates
                automatically when drawdown exceeds thresholds — pausing new entries until
                conditions recover.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Hard stop-loss on every position",
                  "Max drawdown circuit breaker",
                  "Rug risk scoring (0–100) before entry",
                  "Liquidity floor requirements",
                  "Daily loss limit enforcement",
                  "Minimum hold time guard",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".875rem", color: "var(--text-2)" }}>
                    <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Risk Parameters (live)</div>
              {[
                { label: "Stop Loss", value: "12%" },
                { label: "Take Profit", value: "25%" },
                { label: "Max Position Size", value: "20%" },
                { label: "Max Open Positions", value: "3" },
                { label: "Min Confidence", value: "0.70" },
                { label: "Min Liquidity", value: "2,000 TON" },
                { label: "Max Rug Risk Score", value: "35 / 100" },
                { label: "Max Daily Loss", value: "15%" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: ".85rem" }}>
                  <span className="text-muted">{r.label}</span>
                  <span className="mono" style={{ color: "var(--text-1)", fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <section className="disclaimer">
        <div className="container">
          <div className="disclaimer-box">
            <div className="disclaimer-title">⚠ Risk Disclosure</div>
            <p className="disclaimer-text">
              REAL Capital is an <strong>experimental AI trading system</strong> operating in paper trading
              simulation mode. All figures shown represent simulated performance, not real capital.
              <strong> Historical performance is not a guarantee of future results.</strong> Cryptocurrency
              trading involves significant risk of loss. This platform does not constitute financial
              advice. Always conduct your own research and consult a qualified financial advisor before
              making investment decisions. The AI system may make errors, experience downtime, or
              underperform in volatile market conditions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">REAL Capital</div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <Link href="/dashboard" style={{ fontSize: ".8rem", color: "var(--text-3)" }}>Dashboard</Link>
              <Link href="/admin/login" style={{ fontSize: ".8rem", color: "var(--text-3)" }}>Admin</Link>
            </div>
            <div className="footer-copy">© SETAEI · realcapital.no · Experimental AI System</div>
          </div>
        </div>
      </footer>
    </>
  );
}
