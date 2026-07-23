import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  batches, categories, deriveAlerts, fifoOrder, locations, money,
  onHand, products, ropSeasonal, ropStandard, suppliers, transactions, users,
  type ABC, type AlertType,
} from "@/lib/inventory-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WalangBrownout · Real-Time Inventory OS" },
      { name: "description", content: "Walang Kulang, Walang Sobra — real-time inventory management for WalangBrownout Appliances. FIFO batches, ABC classification, seasonal reorder alerts." },
      { property: "og:title", content: "WalangBrownout · Real-Time Inventory OS" },
      { property: "og:description", content: "Walang Kulang, Walang Sobra — real-time inventory management for WalangBrownout Appliances. FIFO batches, ABC classification, seasonal reorder alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Tab = "overview" | "inventory" | "batches" | "alerts";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const alerts = useMemo(deriveAlerts, []);

  const totalValue = useMemo(
    () => products.reduce((s, p) => s + onHand(p.sku) * p.unitCost, 0),
    []
  );
  const totalSkus = products.length;
  const openAlerts = alerts.filter(a => a.status === "OPEN").length;
  const todayTx = transactions.length;

  return (
    <div className="min-h-screen bg-background">
      <TopNav tab={tab} setTab={setTab} openAlerts={openAlerts} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "overview" && (
          <OverviewPage
            totalValue={totalValue}
            totalSkus={totalSkus}
            openAlerts={openAlerts}
            todayTx={todayTx}
            alerts={alerts}
          />
        )}
        {tab === "inventory" && <InventoryPage />}
        {tab === "batches" && <BatchesPage />}
        {tab === "alerts" && <AlertsPage alerts={alerts} />}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-4 text-xs text-muted-foreground">
        <p>WalangBrownout Inventory OS · Prototype by Maturan · Merilles · Ocariza · Pacao</p>
      </footer>
    </div>
  );
}

/* --------------------------------- Nav ---------------------------------- */

function TopNav({ tab, setTab, openAlerts }: { tab: Tab; setTab: (t: Tab) => void; openAlerts: number }) {
  const items: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "inventory", label: "Inventory" },
    { key: "batches", label: "Batches" },
    { key: "alerts", label: "Alerts" },
  ];
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground font-bold"
            style={{ background: "var(--gradient-hero)" }}
          >
            WB
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">WalangBrownout</h1>
            <p className="text-xs text-muted-foreground">Walang Kulang, Walang Sobra · Inventory OS</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {items.map(it => {
            const active = tab === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setTab(it.key)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.label}
                {it.key === "alerts" && openAlerts > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-primary-foreground">
                    {openAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------ Overview -------------------------------- */

function OverviewPage({
  totalValue, totalSkus, openAlerts, todayTx, alerts,
}: {
  totalValue: number; totalSkus: number; openAlerts: number; todayTx: number;
  alerts: ReturnType<typeof deriveAlerts>;
}) {
  return (
    <div className="space-y-8">
      <section
        className="rounded-2xl border border-border p-8 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">Real-Time Inventory OS</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight">
          Stop the summer crunch, the mystery shrinkage, and the expiry trap — all from one live dashboard.
        </h2>
        <p className="mt-3 max-w-2xl text-sm opacity-90">
          Every receipt, sale, transfer, and write-off writes to the transaction log instantly. FIFO picks
          the oldest batch. Seasonal ROP formulas fire alerts before the next Summer Crunch.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Inventory Value" value={money(totalValue)} tone="primary" />
        <Kpi label="Active SKUs" value={String(totalSkus)} tone="info" />
        <Kpi label="Transactions Today" value={String(todayTx)} tone="success" />
        <Kpi label="Open Alerts" value={String(openAlerts)} tone="danger" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Live Transaction Feed
            </h3>
            <span className="chip bg-success/15 text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> live
            </span>
          </div>
          <ul className="divide-y divide-border">
            {transactions.map(tx => {
              const p = products.find(pp => pp.sku === tx.sku);
              const user = users.find(u => u.id === tx.userId);
              return (
                <li key={tx.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <TxBadge type={tx.type} />
                    <div>
                      <div className="font-medium">{p?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.sku} · {tx.channel.toLowerCase()} · {user?.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm ${tx.quantityDelta < 0 ? "text-danger" : "text-success"}`}>
                      {tx.quantityDelta > 0 ? "+" : ""}{tx.quantityDelta}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString("en-PH", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card-surface">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Alerts</h3>
          </div>
          <ul className="divide-y divide-border">
            {alerts.length === 0 && (
              <li className="px-6 py-8 text-center text-sm text-muted-foreground">All clear · nothing to reorder</li>
            )}
            {alerts.slice(0, 6).map(a => (
              <li key={a.id} className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <AlertChip type={a.type} />
                  <span className="text-sm font-medium">{a.sku}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Reorder-Point Logic
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Non-seasonal</p>
            <p className="mt-1 font-mono text-sm">ROP = (Avg Daily Usage × Lead Time) + Safety Stock</p>
            <p className="mt-2 text-xs text-muted-foreground">Smart Thermostat: (4 × 10) + 15 = <b className="text-foreground">55 units</b></p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seasonal</p>
            <p className="mt-1 font-mono text-sm">ROP = (Avg × Seasonal Factor × Lead Time) + Safety Stock</p>
            <p className="mt-2 text-xs text-muted-foreground">Portable AC (Jun): (10 × 3.0 × 14) + 100 = <b className="text-foreground">520 units</b></p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "primary" | "info" | "success" | "danger" }) {
  const toneMap = {
    primary: "text-primary bg-primary/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
    danger: "text-danger bg-danger/10",
  } as const;
  return (
    <div className="card-surface p-5">
      <div className={`chip ${toneMap[tone]}`}>{label}</div>
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

/* ------------------------------ Inventory ------------------------------- */

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [abcFilter, setAbcFilter] = useState<"" | ABC>("");

  const rows = products
    .filter(p => (abcFilter ? p.abc === abcFilter : true))
    .filter(p =>
      query.trim() === "" ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Master product catalog · ABC-classified · reorder settings" />

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search SKU or product name…"
          className="w-72 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1 text-xs">
          {(["", "A", "B", "C"] as const).map(v => (
            <button
              key={v || "all"}
              onClick={() => setAbcFilter(v as "" | ABC)}
              className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
                abcFilter === v ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "" ? "All" : `Class ${v}`}
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>SKU</Th><Th>Product</Th><Th>Category</Th><Th>ABC</Th>
              <Th className="text-right">On Hand</Th><Th className="text-right">ROP</Th>
              <Th className="text-right">Unit Cost</Th><Th>Flags</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(p => {
              const stock = onHand(p.sku);
              const rop = p.seasonalFlag ? ropSeasonal(p) : ropStandard(p);
              const low = stock <= rop;
              return (
                <tr key={p.sku} className="hover:bg-muted/50">
                  <Td className="font-mono text-xs">{p.sku}</Td>
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="text-muted-foreground">{categories.find(c => c.id === p.categoryId)?.name}</Td>
                  <Td><AbcChip abc={p.abc} /></Td>
                  <Td className={`text-right font-mono ${low ? "text-danger font-semibold" : ""}`}>{stock}</Td>
                  <Td className="text-right font-mono text-muted-foreground">{rop}</Td>
                  <Td className="text-right font-mono">{money(p.unitCost)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {p.seasonalFlag && <span className="chip bg-accent/15 text-accent-foreground" style={{ color: "var(--accent)" }}>seasonal</span>}
                      {p.isFifoCritical && <span className="chip bg-info/15" style={{ color: "var(--info)" }}>FIFO</span>}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetaCard title="Suppliers">
          {suppliers.map(s => (
            <div key={s.id} className="flex justify-between py-1 text-sm">
              <span>{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.contact}</span>
            </div>
          ))}
        </MetaCard>
        <MetaCard title="Warehouse Locations">
          {locations.map(l => (
            <div key={l.id} className="flex justify-between py-1 text-sm">
              <span className="font-mono text-xs">{l.code}</span>
              <span className="text-xs text-muted-foreground">{l.description}</span>
            </div>
          ))}
        </MetaCard>
        <MetaCard title="User Roles">
          {users.map(u => (
            <div key={u.id} className="flex justify-between py-1 text-sm">
              <span>{u.name}</span>
              <span className="text-xs text-muted-foreground">{u.role}</span>
            </div>
          ))}
        </MetaCard>
      </div>
    </div>
  );
}

/* ------------------------------- Batches -------------------------------- */

function BatchesPage() {
  const grouped = products.map(p => ({ product: p, batches: fifoOrder(p.sku) }));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        subtitle="FIFO pick order · oldest dateReceived first · expiration monitored for FIFO-critical items"
      />

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>Batch</Th><Th>SKU</Th><Th>Location</Th>
              <Th className="text-right">Received</Th><Th className="text-right">Remaining</Th>
              <Th>Date Received</Th><Th>Expiration</Th><Th>Pick Order</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grouped.flatMap(({ product, batches: bs }) =>
              bs.map((b, idx) => {
                const loc = locations.find(l => l.id === b.locationId);
                const isNext = idx === 0;
                const daysToExp = b.expirationDate
                  ? Math.ceil((new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const nearExp = daysToExp !== null && daysToExp <= 30;
                return (
                  <tr key={b.id} className="hover:bg-muted/50">
                    <Td className="font-mono text-xs">{b.id}</Td>
                    <Td className="font-mono text-xs">{b.sku}</Td>
                    <Td className="text-muted-foreground">{loc?.code}</Td>
                    <Td className="text-right font-mono">{b.quantityReceived}</Td>
                    <Td className="text-right font-mono">{b.quantityRemaining}</Td>
                    <Td className="text-muted-foreground">{b.dateReceived}</Td>
                    <Td>
                      {b.expirationDate ? (
                        <span className={nearExp ? "text-danger font-semibold" : "text-muted-foreground"}>
                          {b.expirationDate}
                          {nearExp && ` · ${daysToExp}d`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td>
                      {isNext ? (
                        <span className="chip bg-primary/15" style={{ color: "var(--primary)" }}>#1 NEXT</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------- Alerts -------------------------------- */

function AlertsPage({ alerts }: { alerts: ReturnType<typeof deriveAlerts> }) {
  const grouped = {
    LOW_STOCK: alerts.filter(a => a.type === "LOW_STOCK"),
    SEASONAL_REORDER: alerts.filter(a => a.type === "SEASONAL_REORDER"),
    NEAR_EXPIRY: alerts.filter(a => a.type === "NEAR_EXPIRY"),
    VARIANCE: alerts.filter(a => a.type === "VARIANCE"),
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        subtitle="Auto-generated from ROP formulas and FIFO expiration windows"
      />
      {(Object.keys(grouped) as AlertType[]).map(k => {
        const list = grouped[k];
        if (list.length === 0) return null;
        return (
          <div key={k} className="card-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertChip type={k} />
                <h3 className="font-semibold">{alertTitle(k)}</h3>
              </div>
              <span className="text-xs text-muted-foreground">{list.length} open</span>
            </div>
            <ul className="divide-y divide-border">
              {list.map(a => {
                const p = products.find(pp => pp.sku === a.sku);
                return (
                  <li key={a.id} className="flex items-start justify-between px-6 py-3">
                    <div>
                      <div className="text-sm font-medium">{p?.name} <span className="font-mono text-xs text-muted-foreground">· {a.sku}</span></div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                    </div>
                    <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                      Acknowledge
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {alerts.length === 0 && (
        <div className="card-surface p-10 text-center text-sm text-muted-foreground">
          Nothing to reorder or expire soon. Enjoy the calm.
        </div>
      )}
    </div>
  );
}

function alertTitle(t: AlertType) {
  return {
    LOW_STOCK: "Low Stock",
    SEASONAL_REORDER: "Seasonal Reorder",
    NEAR_EXPIRY: "Near Expiry (FIFO)",
    VARIANCE: "Inventory Variance",
  }[t];
}

/* --------------------------- Small primitives --------------------------- */

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function MetaCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface p-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="mt-3 divide-y divide-border">{children}</div>
    </div>
  );
}

function AbcChip({ abc }: { abc: ABC }) {
  const map = {
    A: { bg: "bg-abc-a/15", color: "var(--abc-a)" },
    B: { bg: "bg-abc-b/15", color: "var(--abc-b)" },
    C: { bg: "bg-abc-c/15", color: "var(--abc-c)" },
  }[abc];
  return <span className={`chip ${map.bg}`} style={{ color: map.color }}>Class {abc}</span>;
}

function TxBadge({ type }: { type: string }) {
  const tone: Record<string, string> = {
    SALE: "bg-danger/15 text-danger",
    RECEIPT: "bg-success/15 text-success",
    ADJUSTMENT: "bg-warning/15",
    TRANSFER: "bg-info/15 text-info",
    RETURN: "bg-info/15 text-info",
    WRITE_OFF: "bg-danger/15 text-danger",
  };
  const style = type === "ADJUSTMENT" ? { color: "var(--warning)" } : undefined;
  return <span className={`chip ${tone[type] ?? "bg-muted"}`} style={style}>{type.replace("_", " ")}</span>;
}

function AlertChip({ type }: { type: AlertType }) {
  const map: Record<AlertType, { bg: string; color: string; label: string }> = {
    LOW_STOCK: { bg: "bg-danger/15", color: "var(--danger)", label: "Low Stock" },
    SEASONAL_REORDER: { bg: "bg-accent/15", color: "var(--accent)", label: "Seasonal" },
    NEAR_EXPIRY: { bg: "bg-warning/15", color: "var(--warning)", label: "Near Expiry" },
    VARIANCE: { bg: "bg-info/15", color: "var(--info)", label: "Variance" },
  };
  const m = map[type];
  return <span className={`chip ${m.bg}`} style={{ color: m.color }}>{m.label}</span>;
}
