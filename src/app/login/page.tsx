"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CrosshairIcon } from "../../components/icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userID", data.userID);
        localStorage.setItem("user", data.user);
        router.push("/");
      } else {
        setError(data.message || "ACCESS DENIED — CHECK YOUR CREDENTIALS");
      }
    } catch {
      setError("NETWORK ERROR — UPLINK FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="rise w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center border border-accent/60 bg-accent/10">
            <CrosshairIcon className="h-7 w-7 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-[0.22em] text-ink">
            ROLLCALL<span className="text-accent">://</span>CONSOLE
          </h1>
          <p className="mt-2 font-mono text-[10px] tracking-[0.35em] text-muted">
            AUTH REQUIRED · ZUVIO FIELD CLIENT
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-line bg-panel p-6"
        >
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
              EMAIL
            </span>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
              PASSWORD
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
              required
            />
          </label>

          {error && (
            <div className="rise border border-danger/40 bg-danger/10 px-4 py-3 font-mono text-xs leading-relaxed text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="notched flex w-full items-center justify-center gap-2.5 bg-accent px-4 py-3 font-display text-sm font-bold tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
              />
            )}
            {loading ? "AUTHENTICATING…" : "AUTHENTICATE"}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[10px] tracking-[0.25em] text-muted/70">
          SESSION TOKEN STORED LOCALLY ON THIS DEVICE
        </p>
      </div>
    </div>
  );
}
