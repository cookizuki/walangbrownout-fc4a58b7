import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  batches, cycleCounts, deriveAlerts, fifoOrder, locations, onHand, pickTasks, products,
  purchaseOrders, receivingLines, ropSeasonal, ropStandard, suppliers, transactions,
  money, type ABC, type Alert, type AlertType,
} from "@/lib/inventory-data";
import { roleLabel, useSession, type Role } from "@/lib/auth";

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

type Tab =
  | "overview" | "inventory" | "batches" | "alerts"
  | "myday" | "counts" | "reorder"
  | "picks" | "receiving";

const PAGE_META: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Page subtitle — real-time system status" },
  inventory: { title: "Inventory", subtitle: "All tracked SKUs, live stock levels" },
  batches: { title: "Batches", subtitle: "FIFO-ordered lots and expiry tracking" },
  alerts: { title: "Alerts", subtitle: "Reorder and expiry notifications" },
  myday: { title: "My Day", subtitle: "Your assigned work for today" },
  counts: { title: "Stock Counts", subtitle: "Cycle counts and variance logging" },
  reorder: { title: "Reorder Review", subtitle: "ROP breaches queued for purchasing" },
  picks: { title: "Pick Tasks", subtitle: "FIFO-enforced picking queue" },
  receiving: { title: "Receiving", subtitle: "Inbound POs, putaway and location" },
};

const ROLE_NAV: Record<Role, Tab[]> = {
  ADMIN: ["overview", "inventory", "batches", "alerts"],
  INVENTORY_STAFF: ["myday", "counts", "inventory", "reorder"],
  WAREHOUSE_STAFF: ["myday", "picks", "receiving", "batches"],
};

function Dashboard() {
  const navigate = useNavigate();
  const { account, ready, signOut } = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [acked, setAcked] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !account) navigate({ to: "/login", replace: true });
  }, [ready, account, navigate]);

  useEffect(() => {
    if (account) setTab(ROLE_NAV[account.role][0]!);
  }, [account?.role]);

  const allAlerts = useMemo(deriveAlerts, []);
  const alerts = allAlerts.filter(a => !acked.includes(a.id));
  const openAlerts = alerts.length;

  if (!ready || !account) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 text-sm text-muted-foreground">
        Loading your workspace…
      </div>
    );
  }

  const navTabs = ROLE_NAV[account.role];
  const meta = PAGE_META[tab];
  const showSearch = tab === "overview" || tab === "inventory";

  const select = (t: Tab) => {
    setTab(t);
    setMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/login", replace: true });
  };

  const nav = (
    <SideNav
      tab={tab}
      setTab={select}
      openAlerts={openAlerts}
      tabs={navTabs}
      name={account.name}
      role={roleLabel(account.role)}
      onSignOut={handleSignOut}
    />
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {nav}

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      {menuOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] md:hidden">
          <SideNav
            tab={tab}
            setTab={select}
            openAlerts={openAlerts}
            tabs={navTabs}
            name={account.name}
            role={roleLabel(account.role)}
            onSignOut={handleSignOut}
            mobile
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            className="relative shrink-0 rounded-md border border-border px-3 py-1.5 text-sm"
          >
            ☰
            {openAlerts > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {openAlerts}
              </span>
            )}
          </button>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate font-semibold">Inventory OS</span>
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-bold text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              WB
            </span>
          </div>
        </div>

        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface px-4 py-4 sm:px-6 md:flex md:flex-wrap md:gap-4">
          <div className="min-w-0 md:flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {roleLabel(account.role)}
            </p>
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">{meta.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>
          <LiveClock />
          {showSearch && (
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="col-span-2 w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary md:order-none md:col-span-1 md:w-56"
            />
          )}
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {tab === "overview" && (
            <OverviewPage query={query} alerts={alerts} onAck={id => setAcked(a => [...a, id])} />
          )}
          {tab === "inventory" && <InventoryPage query={query} />}
          {tab === "batches" && <BatchesPage />}
          {tab === "alerts" && <AlertsPage alerts={alerts} onAck={id => setAcked(a => [...a, id])} />}
          {tab === "myday" && <MyDayPage role={account.role} name={account.name} alerts={alerts} />}
          {tab === "counts" && <StockCountsPage />}
          {tab === "reorder" && <ReorderReviewPage />}
          {tab === "picks" && <PickTasksPage />}
          {tab === "receiving" && <ReceivingPage />}
        </main>
      </div>
    </div>
  );
}


/* ------------------------------- Sidebar -------------------------------- */

function SideNav({
  tab, setTab, openAlerts, tabs, name, role, onSignOut, mobile = false,
}: {
  tab: Tab; setTab: (t: Tab) => void; openAlerts: number; tabs: Tab[];
  name: string; role: string; onSignOut: () => void; mobile?: boolean;
}) {
  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col border-r border-border bg-surface"
          : "hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex"
      }
    >
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Brand / Logo mark</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            WB
          </span>
          <span className="font-semibold">Inventory OS</span>
        </div>
      </div>

      <p className="px-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Main navigation</p>
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {tabs.map(key => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-border bg-muted font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span>{PAGE_META[key].title}</span>
              {key === "alerts" && openAlerts > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                  {openAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">User profile / account</p>
        <div className="mt-2 flex items-center gap-2 border-t border-dashed border-border pt-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">
            {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-muted-foreground">{role}</div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}


function LiveClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-PH", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live system clock</p>
      <div className="flex items-center justify-end gap-1.5 font-mono text-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        {now || "--:--:--"}
      </div>
    </div>
  );
}

/* ------------------------------- Overview ------------------------------- */

function OverviewPage({ query, alerts, onAck }: { query: string; alerts: Alert[]; onAck: (id: string) => void }) {
  const q = query.trim().toLowerCase();
  const feed = transactions.filter(tx => {
    if (!q) return true;
    const p = products.find(pp => pp.sku === tx.sku);
    return tx.sku.toLowerCase().includes(q) || (p?.name.toLowerCase().includes(q) ?? false);
  });
  const nearExpiry = batches.filter(b => {
    const d = daysLeft(b.expirationDate);
    return d !== null && d <= 30;
  }).length;

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">KPI summary cards</p>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value={String(products.length)} label="Active SKUs Tracked" />
        <Kpi value={String(alerts.length)} label="Open Alerts" />
        <Kpi value={String(nearExpiry)} label="Batches Nearing Expiry" />
        <Kpi value="0s" label="Sync Delay" />
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Panel — auto-refreshes every ~3.5s
          </p>
          <div className="card-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Live Transaction Feed</h2>
              <span className="chip bg-success/15 text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> streaming
              </span>
            </div>
            <ul className="divide-y divide-dashed divide-border">
              {feed.map(tx => {
                const p = products.find(pp => pp.sku === tx.sku);
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full border border-border" />
                      <span className="truncate">
                        {titleCase(tx.type)} — {p?.name}{" "}
                        <span className={tx.quantityDelta < 0 ? "text-danger" : "text-success"}>
                          {tx.quantityDelta > 0 ? "+" : ""}{tx.quantityDelta}
                        </span>{" "}
                        <span className="text-muted-foreground">· {titleCase(tx.channel)}</span>
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground"><TimeAgo iso={tx.timestamp} /></span>
                  </li>
                );
              })}
              {feed.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">No matching transactions</li>
              )}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Panel — mirrors Alerts screen, top 3
          </p>
          <div className="card-surface">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Active Alerts</h2>
            </div>
            <div className="space-y-3 p-4">
              {alerts.slice(0, 3).map(a => (
                <AlertCard key={a.id} alert={a} onAck={onAck} compact />
              ))}
              {alerts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">All clear · nothing to reorder</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-surface p-5">
      <div className="font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/* ------------------------------ Inventory ------------------------------- */

type Pill = "All" | "Class A" | "Class B" | "Class C" | "FIFO-critical";

function InventoryPage({ query }: { query: string }) {
  const [pill, setPill] = useState<Pill>("All");
  const q = query.trim().toLowerCase();

  const rows = products
    .filter(p => {
      if (pill === "All") return true;
      if (pill === "FIFO-critical") return p.isFifoCritical;
      return p.abc === (pill.slice(-1) as ABC);
    })
    .filter(p => !q || p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Product table panel</p>
      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
          {(["All", "Class A", "Class B", "Class C", "FIFO-critical"] as Pill[]).map(v => (
            <button
              key={v}
              onClick={() => setPill(v)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                pill === v ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <Th>SKU</Th><Th>Product</Th><Th>Class</Th><Th>Stock Level</Th>
              <Th>Qty / ROP</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-border">
            {rows.map(p => {
              const qty = onHand(p.sku);
              const rop = p.seasonalFlag ? ropSeasonal(p) : ropStandard(p);
              const ratio = Math.min(qty / Math.max(rop, 1), 1.5);
              const status = qty <= rop ? "REORDER" : ratio < 1.35 ? "WATCH" : "OK";
              return (
                <tr key={p.sku} className="hover:bg-muted/40">
                  <Td className="font-mono text-xs">{p.sku}</Td>
                  <Td className="font-medium">{p.name}</Td>
                  <Td>
                    <span className="inline-grid h-6 w-6 place-items-center rounded border border-border text-[11px] font-semibold">
                      {p.abc}
                    </span>
                  </Td>
                  <Td>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${status === "REORDER" ? "bg-danger" : status === "WATCH" ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min((ratio / 1.5) * 100, 100)}%` }}
                      />
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{qty} / {rop}</Td>
                  <Td><StatusPill status={status} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <p className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Stock-level bar: filled = qty vs. reorder point · status pill: OK / WATCH / REORDER
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "OK" | "WATCH" | "REORDER" }) {
  const map = {
    OK: "border-success/40 text-success",
    WATCH: "border-warning/50 text-warning",
    REORDER: "border-danger/50 text-danger",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ------------------------------- Batches -------------------------------- */

function BatchesPage() {
  const rows = products.flatMap(p => fifoOrder(p.sku).map((b, idx) => ({ b, idx })));
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Batch tracking panel — one row per received lot
      </p>
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <Th>Batch ID</Th><Th>SKU</Th><Th>Qty Remaining</Th><Th>Received</Th>
              <Th>Expiry</Th><Th>Days Left</Th><Th>Pick Order</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-border">
            {rows.map(({ b, idx }) => {
              const d = daysLeft(b.expirationDate);
              const soon = d !== null && d <= 30;
              const loc = locations.find(l => l.id === b.locationId);
              return (
                <tr key={b.id} className="hover:bg-muted/40">
                  <Td className="font-mono text-xs">{b.id}</Td>
                  <Td className="font-mono text-xs">
                    {b.sku} <span className="text-muted-foreground">· {loc?.code}</span>
                  </Td>
                  <Td className="font-mono">{b.quantityRemaining}</Td>
                  <Td className="text-muted-foreground">{b.dateReceived}</Td>
                  <Td className="text-muted-foreground">{b.expirationDate ?? "—"}</Td>
                  <Td className={soon ? "font-semibold text-danger" : "text-muted-foreground"}>
                    {d === null ? "—" : `${d} days`}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {idx === 0 ? (
                        <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold text-background">#1 NEXT</span>
                      ) : (
                        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">#{idx + 1}</span>
                      )}
                      {d !== null && (
                        <span className={`rounded-full border border-dashed px-2.5 py-1 text-[10px] font-semibold ${soon ? "border-danger/50 text-danger" : "border-border text-muted-foreground"}`}>
                          {soon ? "EXPIRING SOON" : "FRESH"}
                        </span>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <p className="px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Days-left countdown drives the expiry markdown flag · pick-order badge #1 = oldest unexpired lot
        </p>
      </div>
    </div>
  );
}

/* -------------------------------- Alerts -------------------------------- */

function AlertsPage({ alerts, onAck }: { alerts: Alert[]; onAck: (id: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Alert list panel — full history, not just top 3
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Open-count badge</p>
      </div>
      <div className="card-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">All Alerts</h2>
          <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            {alerts.length} OPEN
          </span>
        </div>
        <ul className="divide-y divide-border">
          {alerts.map(a => (
            <li key={a.id} className="px-5 py-4">
              <AlertCard alert={a} onAck={onAck} />
            </li>
          ))}
          {alerts.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nothing to reorder or expire soon. Enjoy the calm.
            </li>
          )}
        </ul>
        <p className="border-t border-border px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Alert row — type icon, title (item), detail (threshold math), tag, timestamp
        </p>
      </div>
    </div>
  );
}

function AlertCard({ alert, onAck, compact = false }: { alert: Alert; onAck: (id: string) => void; compact?: boolean }) {
  const p = products.find(pp => pp.sku === alert.sku);
  const tag = { LOW_STOCK: "STANDARD", SEASONAL_REORDER: "SEASONAL", NEAR_EXPIRY: "FIFO", VARIANCE: "VARIANCE" }[alert.type as AlertType];
  const title = alert.batchId ? `${p?.name} — Batch ${alert.batchId}` : p?.name;

  return (
    <div className={compact ? "rounded-lg border border-dashed border-border p-3" : "flex items-start justify-between gap-4"}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-sm font-bold">
          !
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{tag}</span>
            <span className="text-[10px] text-muted-foreground"><TimeAgo iso={alert.createdAt} /></span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onAck(alert.id)}
        className={`shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted ${compact ? "mt-3 w-full" : ""}`}
      >
        Acknowledge
      </button>
    </div>
  );
}

/* ------------------------------- Helpers -------------------------------- */

function daysLeft(dateISO?: string): number | null {
  if (!dateISO) return null;
  return Math.ceil((new Date(dateISO).getTime() - Date.now()) / 86400000);
}

function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => setLabel(timeAgo(iso)), [iso]);
  return <>{label || "—"}</>;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}

/* --------------------------- Shared role pieces --------------------------- */

function TaskPill({ status }: { status: "PENDING" | "IN_PROGRESS" | "DONE" }) {
  const map = {
    PENDING: "border-warning/50 text-warning",
    IN_PROGRESS: "border-info/50 text-info",
    DONE: "border-success/40 text-success",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${map[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {titleCase(status)}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function Panel({ title, right, children, footer }: { title: string; right?: React.ReactNode; children: React.ReactNode; footer?: string }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {right}
      </div>
      {children}
      {footer && <p className="border-t border-border px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">{footer}</p>}
    </div>
  );
}

/* -------------------------------- My Day --------------------------------- */

function MyDayPage({ role, name, alerts }: { role: Role; name: string; alerts: Alert[] }) {
  const isWarehouse = role === "WAREHOUSE_STAFF";
  const openPicks = pickTasks.filter(t => t.status !== "DONE");
  const openCounts = cycleCounts.filter(c => c.status !== "DONE");
  const inbound = receivingLines.filter(r => r.status !== "PUT_AWAY");
  const variances = cycleCounts.filter(c => c.countedQty !== null && c.countedQty !== c.systemQty);

  return (
    <div className="space-y-5">
      <SectionLabel>KPI summary cards</SectionLabel>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isWarehouse ? (
          <>
            <Kpi value={String(openPicks.length)} label="Open Pick Tasks" />
            <Kpi value={String(openPicks.filter(t => t.priority === "HIGH").length)} label="High Priority" />
            <Kpi value={String(inbound.length)} label="Inbound Deliveries" />
            <Kpi value={String(batches.filter(b => { const d = daysLeft(b.expirationDate); return d !== null && d <= 30; }).length)} label="Lots Expiring ≤30d" />
          </>
        ) : (
          <>
            <Kpi value={String(openCounts.length)} label="Counts Due Today" />
            <Kpi value={String(variances.length)} label="Variances Logged" />
            <Kpi value={String(alerts.filter(a => a.type !== "NEAR_EXPIRY").length)} label="ROP Breaches" />
            <Kpi value={String(products.length)} label="SKUs In Scope" />
          </>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionLabel>Panel — your queue for today</SectionLabel>
          <div className="mt-1.5">
            <Panel title={isWarehouse ? "Assigned Pick Tasks" : "Assigned Cycle Counts"} right={<span className="chip bg-info/15 text-info">{name}</span>}>
              <ul className="divide-y divide-dashed divide-border">
                {isWarehouse
                  ? openPicks.map(t => {
                      const p = products.find(pp => pp.sku === t.sku);
                      const loc = locations.find(l => l.id === t.locationId);
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{p?.name} · {t.quantity} pcs</div>
                            <div className="text-xs text-muted-foreground">
                              {t.id} · Batch {t.batchId} · {loc?.code} · {t.orderRef}
                            </div>
                          </div>
                          <TaskPill status={t.status} />
                        </li>
                      );
                    })
                  : openCounts.map(c => {
                      const p = products.find(pp => pp.sku === c.sku);
                      const loc = locations.find(l => l.id === c.locationId);
                      return (
                        <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{p?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.id} · {loc?.code} · system {c.systemQty} · due {c.dueDate}
                            </div>
                          </div>
                          <TaskPill status={c.status} />
                        </li>
                      );
                    })}
              </ul>
            </Panel>
          </div>
        </div>

        <div className="lg:col-span-2">
          <SectionLabel>Panel — what needs your eyes</SectionLabel>
          <div className="mt-1.5">
            <Panel title={isWarehouse ? "Inbound Today" : "Reorder Watchlist"}>
              <ul className="divide-y divide-dashed divide-border">
                {isWarehouse
                  ? inbound.map(r => {
                      const p = products.find(pp => pp.sku === r.sku);
                      return (
                        <li key={r.id} className="px-5 py-3 text-sm">
                          <div className="truncate font-medium">{p?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.poNumber} · {r.quantityOrdered} pcs · ETA {r.expectedDate}
                          </div>
                        </li>
                      );
                    })
                  : alerts.slice(0, 4).map(a => (
                      <li key={a.id} className="px-5 py-3 text-sm">
                        <div className="truncate font-medium">{products.find(p => p.sku === a.sku)?.name}</div>
                        <p className="text-xs text-muted-foreground">{a.message}</p>
                      </li>
                    ))}
                {(isWarehouse ? inbound : alerts).length === 0 && (
                  <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing pending.</li>
                )}
              </ul>
            </Panel>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ----------------------- Inventory staff: counts ------------------------- */

function StockCountsPage() {
  const [counted, setCounted] = useState<Record<string, string>>({});

  return (
    <div className="space-y-2">
      <SectionLabel>Cycle count panel — variance = counted − system</SectionLabel>
      <Panel
        title="Stock Counts"
        right={
          <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            {cycleCounts.filter(c => c.status !== "DONE").length} DUE
          </span>
        }
        footer="Variance drives the adjustment transaction logged against the batch"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Count ID</Th><Th>Product</Th><Th>Location</Th><Th>System</Th>
                <Th>Counted</Th><Th>Variance</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-border">
              {cycleCounts.map(c => {
                const p = products.find(pp => pp.sku === c.sku);
                const loc = locations.find(l => l.id === c.locationId);
                const entered = counted[c.id];
                const value = c.countedQty ?? (entered !== undefined && entered !== "" ? Number(entered) : null);
                const variance = value === null ? null : value - c.systemQty;
                return (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <Td className="font-mono text-xs">{c.id}</Td>
                    <Td className="font-medium">{p?.name}</Td>
                    <Td className="text-muted-foreground">{loc?.code}</Td>
                    <Td className="font-mono">{c.systemQty}</Td>
                    <Td>
                      {c.countedQty !== null ? (
                        <span className="font-mono">{c.countedQty}</span>
                      ) : (
                        <input
                          inputMode="numeric"
                          value={entered ?? ""}
                          onChange={e => setCounted(s => ({ ...s, [c.id]: e.target.value.replace(/[^\d]/g, "").slice(0, 6) }))}
                          placeholder="—"
                          className="w-20 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-primary"
                        />
                      )}
                    </Td>
                    <Td className={`font-mono ${variance && variance !== 0 ? "font-semibold text-danger" : "text-muted-foreground"}`}>
                      {variance === null ? "—" : variance > 0 ? `+${variance}` : variance}
                    </Td>
                    <Td><TaskPill status={value !== null && c.status === "PENDING" ? "IN_PROGRESS" : c.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ReorderReviewPage() {
  const rows = products
    .map(p => {
      const qty = onHand(p.sku);
      const rop = p.seasonalFlag ? ropSeasonal(p) : ropStandard(p);
      return { p, qty, rop, gap: rop - qty };
    })
    .filter(r => r.gap >= 0)
    .sort((a, b) => b.gap - a.gap);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SectionLabel>Reorder queue — ROP breaches ready for purchasing</SectionLabel>
        <Panel title="Suggested Reorders" footer="Standard ROP = ADU × Lead Time + Safety Stock · Seasonal ROP multiplies ADU by the seasonal factor">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>SKU</Th><Th>Product</Th><Th>On Hand / ROP</Th><Th>Formula</Th>
                  <Th>Suggested Qty</Th><Th>Est. Cost</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-border">
                {rows.map(({ p, qty, rop }) => (
                  <tr key={p.sku} className="hover:bg-muted/40">
                    <Td className="font-mono text-xs">{p.sku}</Td>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className="font-mono text-xs">{qty} / {rop}</Td>
                    <Td className="text-xs text-muted-foreground">
                      {p.seasonalFlag
                        ? `${p.avgDailyUsage} × ${p.seasonalFactor} × ${p.leadTimeDays} + ${p.safetyStock}`
                        : `${p.avgDailyUsage} × ${p.leadTimeDays} + ${p.safetyStock}`}
                    </Td>
                    <Td className="font-mono">{p.reorderQuantity}</Td>
                    <Td className="font-mono text-xs">{money(p.reorderQuantity * p.unitCost)}</Td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><Td className="py-8 text-center text-muted-foreground">Nothing below reorder point.</Td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="space-y-2">
        <SectionLabel>Purchase orders already raised</SectionLabel>
        <Panel title="Open Purchase Orders">
          <ul className="divide-y divide-dashed divide-border">
            {purchaseOrders.map(po => {
              const p = products.find(pp => pp.sku === po.sku);
              const s = suppliers.find(su => su.id === po.supplierId);
              return (
                <li key={po.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{po.id} · {p?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s?.name} · {po.quantity} pcs · {money(po.quantity * po.unitCost)}
                    </div>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    {titleCase(po.status)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------- Warehouse staff: picks & receiving ------------------- */

function PickTasksPage() {
  const [done, setDone] = useState<string[]>([]);
  const order = { HIGH: 0, NORMAL: 1, LOW: 2 } as const;
  const rows = [...pickTasks].sort((a, b) => order[a.priority] - order[b.priority]);

  return (
    <div className="space-y-2">
      <SectionLabel>Pick queue — batch is pre-assigned by FIFO, oldest lot first</SectionLabel>
      <Panel
        title="Pick Tasks"
        right={
          <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            {rows.filter(t => t.status !== "DONE" && !done.includes(t.id)).length} OPEN
          </span>
        }
        footer="Picking a different lot than the assigned batch breaks FIFO and raises a variance alert"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Task</Th><Th>Product</Th><Th>Pick From</Th><Th>Qty</Th>
                <Th>Order</Th><Th>Priority</Th><Th>Status</Th><Th>{" "}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-border">
              {rows.map(t => {
                const p = products.find(pp => pp.sku === t.sku);
                const loc = locations.find(l => l.id === t.locationId);
                const status = done.includes(t.id) ? "DONE" : t.status;
                return (
                  <tr key={t.id} className="hover:bg-muted/40">
                    <Td className="font-mono text-xs">{t.id}</Td>
                    <Td className="font-medium">{p?.name}</Td>
                    <Td className="font-mono text-xs">
                      {t.batchId} <span className="text-muted-foreground">· {loc?.code}</span>
                    </Td>
                    <Td className="font-mono">{t.quantity}</Td>
                    <Td className="font-mono text-xs text-muted-foreground">{t.orderRef}</Td>
                    <Td>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                        t.priority === "HIGH" ? "border-danger/50 text-danger"
                        : t.priority === "NORMAL" ? "border-border text-muted-foreground"
                        : "border-dashed border-border text-muted-foreground"
                      }`}>
                        {t.priority}
                      </span>
                    </Td>
                    <Td><TaskPill status={status} /></Td>
                    <Td>
                      {status !== "DONE" && (
                        <button
                          onClick={() => setDone(d => [...d, t.id])}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Mark picked
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ReceivingPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SectionLabel>Inbound panel — one row per PO line</SectionLabel>
        <Panel title="Receiving & Putaway" footer="Receiving creates a new inventory batch stamped with date received and its warehouse location">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Line</Th><Th>PO</Th><Th>Product</Th><Th>Supplier</Th>
                  <Th>Ordered / Received</Th><Th>ETA</Th><Th>Putaway</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-border">
                {receivingLines.map(r => {
                  const p = products.find(pp => pp.sku === r.sku);
                  const s = suppliers.find(su => su.id === r.supplierId);
                  const loc = locations.find(l => l.id === r.locationId);
                  return (
                    <tr key={r.id} className="hover:bg-muted/40">
                      <Td className="font-mono text-xs">{r.id}</Td>
                      <Td className="font-mono text-xs">{r.poNumber}</Td>
                      <Td className="font-medium">{p?.name}</Td>
                      <Td className="text-muted-foreground">{s?.name}</Td>
                      <Td className="font-mono text-xs">{r.quantityOrdered} / {r.quantityReceived}</Td>
                      <Td className="text-muted-foreground">{r.expectedDate}</Td>
                      <Td className="font-mono text-xs">{loc?.code}</Td>
                      <Td>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          r.status === "IN_TRANSIT" ? "border-warning/50 text-warning"
                          : r.status === "ARRIVED" ? "border-info/50 text-info"
                          : "border-success/40 text-success"
                        }`}>
                          {titleCase(r.status)}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="space-y-2">
        <SectionLabel>Storage map — where the lots live</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map(l => {
            const lots = batches.filter(b => b.locationId === l.id);
            const qty = lots.reduce((s, b) => s + b.quantityRemaining, 0);
            return (
              <div key={l.id} className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">{l.code}</span>
                  <span className="chip border border-border text-muted-foreground">{lots.length} lots</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
                <div className="mt-3 font-display text-2xl font-semibold">{qty}</div>
                <div className="text-xs text-muted-foreground">units on hand</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
