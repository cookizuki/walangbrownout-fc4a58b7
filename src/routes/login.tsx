import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAccounts, roleLabel, ROLES, signIn, type Account, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in · WalangBrownout Inventory OS" },
      { name: "description", content: "Log in to WalangBrownout Inventory OS. Pick your account and land on the dashboard built for your role." },
      { property: "og:title", content: "Log in · WalangBrownout Inventory OS" },
      { property: "og:description", content: "Pick your account and land on the dashboard built for your role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<Role | "ALL">("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setAccounts(listAccounts()), []);

  const rows = accounts.filter(a => filter === "ALL" || a.role === filter);

  const enter = () => {
    if (!selected) return setError("Pick an account to continue.");
    signIn(selected);
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-md text-[11px] font-bold text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            WB
          </span>
          <span className="font-semibold">WalangBrownout · Inventory OS</span>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Log in</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Choose your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each account opens a different workspace — Walang Kulang, Walang Sobra.
          </p>
        </div>

        <div className="mt-5 card-surface overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
            {(["ALL", ...ROLES.map(r => r.key)] as (Role | "ALL")[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "ALL" ? "All roles" : roleLabel(f)}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-dashed divide-border">
            {rows.map(a => {
              const active = selected === a.id;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => { setSelected(a.id); setError(""); }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:px-5 ${
                      active ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">
                      {a.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground sm:inline">
                      {roleLabel(a.role)}
                    </span>
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        active ? "border-foreground bg-foreground" : "border-border"
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                    </span>
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">No accounts for this role yet.</li>
            )}
          </ul>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={enter}
            className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Log in
          </button>
          <p className="text-xs text-muted-foreground">
            No account yet?{" "}
            <Link to="/signup" className="font-semibold text-foreground underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
