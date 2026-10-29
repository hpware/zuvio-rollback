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
        setError(data.message || "Login failed — check your credentials.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="rise w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent/10">
            <CrosshairIcon className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-ink">Rollcall</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in with your Zuvio account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-line bg-panel p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </span>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </label>

          {error && (
            <div className="rise rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            )}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
