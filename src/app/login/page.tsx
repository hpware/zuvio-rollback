"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        try {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userID", data.userID);
          localStorage.setItem("user", data.user);
        } catch {
          setError("無法儲存登入資訊，請確認瀏覽器已啟用 localStorage。");
          setLoading(false);
          return;
        }
        router.push("/");
      } else {
        setError(data.message || "登入失敗，請確認帳號密碼。");
      }
    } catch {
      setError("網路錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 hover:border-muted focus:border-accent";

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="rise w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-line bg-panel p-6 shadow-sm"
        >
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-ink">登入</h1>
            <p className="mt-1 text-sm text-muted">
              使用您的 Zuvio 帳號登入
            </p>
          </div>

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
              密碼
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
            <div className="rise bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent"
              />
            )}
            {loading ? "登入中…" : "登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
