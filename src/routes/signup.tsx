import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createAccount, emailTaken, ROLES, signIn, type Role } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account · WalangBrownout Inventory OS" },
      { name: "description", content: "Sign up for WalangBrownout Inventory OS as an administrator, inventory staff, or warehouse staff and get a workspace built for your role." },
      { property: "og:title", content: "Create your account · WalangBrownout Inventory OS" },
      { property: "og:description", content: "Pick your role — administrator, inventory staff, or warehouse staff — and get a workspace built for it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!role) return setError("Pick the role this account will use.");
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (emailTaken(email)) return setError("An account with that email already exists.");

    const acct = createAccount({ name, email, role });
    signIn(acct.id);
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Create account</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Sign up for your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the account type — the dashboard you land on is built for that role.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Step 1 — pick an account type
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {ROLES.map(r => {
                const active = role === r.key;
                return (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`card-surface p-4 text-left transition-colors ${
                      active ? "border-foreground bg-surface shadow-sm" : "hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          active ? "border-foreground bg-foreground" : "border-border"
                        }`}
                      >
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{r.blurb}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.scope.map(s => (
                        <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card-surface p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Step 2 — your details
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Full name</span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Juan Dela Cruz"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs text-muted-foreground">Work email</span>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  maxLength={120}
                  placeholder="juan@walangbrownout.ph"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:w-auto sm:px-6"
            >
              Create account & continue
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-foreground underline underline-offset-2">
                Log in
              </Link>
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}
