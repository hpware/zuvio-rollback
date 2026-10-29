"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  RefreshIcon,
  SearchIcon,
  PowerIcon,
  CopyIcon,
  CheckIcon,
} from "../components/icons";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[360px] w-full place-items-center bg-panel2">
      <span className="text-sm text-muted">地圖載入中…</span>
    </div>
  ),
});

const DEFAULT_POSITION: [number, number] = [
  25.13587249634042, 121.47020801301439,
];

interface Course {
  course_id: string;
  course_name: string;
  instructor_name: string;
}

type ApiData = Record<string, unknown> & {
  status?: boolean;
  message?: string;
};

function extractRollcallIds(
  input: unknown,
  found = new Set<string>(),
): string[] {
  if (Array.isArray(input)) {
    input.forEach((item) => extractRollcallIds(item, found));
  } else if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      if (
        key === "rollcall_id" &&
        (typeof value === "string" || typeof value === "number")
      ) {
        found.add(String(value));
      } else {
        extractRollcallIds(value, found);
      }
    }
  }
  return [...found].slice(0, 12);
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

function Panel({
  title,
  aside,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section
      className={`rise border border-line bg-panel shadow-sm ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {aside}
      </header>
      <div className="space-y-4 px-5 pb-5">{children}</div>
    </section>
  );
}

function StatusBanner({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: React.ReactNode;
}) {
  const styles =
    kind === "success"
      ? "bg-success/10 text-success"
      : "bg-danger/10 text-danger";
  return <div className={`rise px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function RawJson({ data }: { data: unknown }) {
  return (
    <details className="group border border-line bg-panel2">
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-xs font-medium text-muted transition-colors hover:text-ink">
        原始回應
        <span className="transition-transform group-open:rotate-90">▸</span>
      </summary>
      <pre className="raw-json max-h-72 overflow-auto border-t border-line p-4 font-mono text-xs leading-relaxed text-muted">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

const inputClass =
  "w-full border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 hover:border-muted focus:border-accent";

const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [courseId, setCourseId] = useState("");
  const [getLoading, setGetLoading] = useState(false);
  const [getResponse, setGetResponse] = useState<ApiData | null>(null);
  const [getError, setGetError] = useState<string | null>(null);

  const [rollcallId, setRollcallId] = useState("");
  const [position, setPosition] =
    useState<[number, number]>(DEFAULT_POSITION);
  const [latInput, setLatInput] = useState(String(DEFAULT_POSITION[0]));
  const [lngInput, setLngInput] = useState(String(DEFAULT_POSITION[1]));
  const [postLoading, setPostLoading] = useState(false);
  const [postResponse, setPostResponse] = useState<ApiData | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getCredentials = useCallback(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("userID");
    if (!token || !userID) {
      router.replace("/login");
      return null;
    }
    return { token, userID };
  }, [router]);

  const fetchCourses = useCallback(async () => {
    const creds = getCredentials();
    if (!creds) return;
    setLoadingCourses(true);
    setCoursesError(null);
    try {
      const query = new URLSearchParams({
        user_id: creds.userID,
        accessToken: creds.token,
      });
      const res = await fetch(`/api/getCourses?${query}`);
      const data = await res.json();
      if (data.status) {
        setCourses(data.courses || []);
      } else {
        setCourses([]);
        setCoursesError(data.message || "登入狀態已失效。");
      }
    } catch {
      setCoursesError("載入課程時發生網路錯誤。");
    } finally {
      setLoadingCourses(false);
    }
  }, [getCredentials]);

  useEffect(() => {
    const creds = getCredentials();
    if (!creds) return;
    setUserId(creds.userID);
    setReady(true);
    fetchCourses();
  }, [getCredentials, fetchCourses]);

  const filteredCourses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (course) =>
        course.course_name.toLowerCase().includes(q) ||
        course.instructor_name.toLowerCase().includes(q) ||
        String(course.course_id).includes(q),
    );
  }, [courses, searchTerm]);

  const selectedCourse = courses.find(
    (course) => String(course.course_id) === courseId,
  );

  const rollcallIds = useMemo(
    () => (getResponse ? extractRollcallIds(getResponse) : []),
    [getResponse],
  );

  const handleGetRollcall = async () => {
    const creds = getCredentials();
    if (!creds || !courseId) return;
    setGetLoading(true);
    setGetError(null);
    setGetResponse(null);
    try {
      const query = new URLSearchParams({
        course_id: courseId,
        user_id: creds.userID,
        accessToken: creds.token,
      });
      const res = await fetch(`/api/getRollcall?${query}`);
      setGetResponse(await res.json());
    } catch {
      setGetError("取得點名時發生網路錯誤。");
    } finally {
      setGetLoading(false);
    }
  };

  const handleMakeRollcall = async () => {
    const creds = getCredentials();
    if (!creds || !rollcallId) return;
    setPostLoading(true);
    setPostError(null);
    setPostResponse(null);
    try {
      const res = await fetch("/api/makeRollcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: creds.userID,
          accessToken: creds.token,
          rollcall_id: rollcallId,
          device: "WEB",
          lat: position[0],
          lng: position[1],
        }),
      });
      setPostResponse(await res.json());
    } catch {
      setPostError("簽到時發生網路錯誤。");
    } finally {
      setPostLoading(false);
    }
  };

  const handleMapClick = ({ lat, lng }: { lat: number; lng: number }) => {
    setPosition([lat, lng]);
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
  };

  const handleCoordInput = (axis: "lat" | "lng", raw: string) => {
    if (axis === "lat") setLatInput(raw);
    else setLngInput(raw);
    const lat = parseFloat(axis === "lat" ? raw : latInput);
    const lng = parseFloat(axis === "lng" ? raw : lngInput);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      setPosition([lat, lng]);
    }
  };

  const copyCoords = async () => {
    try {
      await navigator.clipboard.writeText(
        `${position[0]}, ${position[1]}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userID");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="text-sm text-muted">載入中…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-panel/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-base font-semibold text-ink">點名小幫手</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">
              {userId}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-danger/40 hover:text-danger"
            >
              <PowerIcon className="h-3.5 w-3.5" />
              登出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel
            title="您的課程"
            delay={0}
            aside={
              <button
                onClick={fetchCourses}
                disabled={loadingCourses}
                className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent disabled:opacity-50"
              >
                <RefreshIcon
                  className={`h-4 w-4 ${loadingCourses ? "animate-spin" : ""}`}
                />
                重新整理
              </button>
            }
          >
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="搜尋課程…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>

            {coursesError && (
              <StatusBanner kind="error">
                <p>無法載入課程 — {coursesError}</p>
                <button
                  onClick={() => router.replace("/login")}
                  className="mt-1 underline underline-offset-2 transition-colors hover:text-ink"
                >
                  回登入頁面
                </button>
              </StatusBanner>
            )}

            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              {loadingCourses ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse border border-line px-4 py-3"
                  >
                    <div className="h-3.5 w-2/3 bg-line" />
                    <div className="mt-2 h-2.5 w-1/3 bg-line" />
                  </div>
                ))
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const active = String(course.course_id) === courseId;
                  return (
                    <button
                      key={course.course_id}
                      onClick={() => setCourseId(String(course.course_id))}
                      className={`group w-full border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-accent bg-accent/5"
                          : "border-line bg-panel hover:border-accent/40 hover:bg-panel2"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {course.course_name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {course.instructor_name} · 編號 {course.course_id}
                          </p>
                        </div>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            active ? "bg-accent" : "bg-line group-hover:bg-muted"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  {courses.length === 0 && !coursesError
                    ? "沒有找到課程。"
                    : "沒有符合搜尋的課程。"}
                </div>
              )}
            </div>

            {!loadingCourses && courses.length > 0 && (
              <p className="text-xs text-muted">
                共 {courses.length} 門課程，顯示 {filteredCourses.length} 門
              </p>
            )}
          </Panel>

          <Panel title="取得點名" delay={60}>
            <div className="border border-line bg-panel2 px-4 py-3 text-sm">
              {selectedCourse ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink">
                    {selectedCourse.course_name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    #{selectedCourse.course_id}
                  </span>
                </div>
              ) : (
                <span className="text-muted">
                  {courseId
                    ? `使用課程編號 ${courseId}`
                    : "請先選擇課程，或在下方輸入課程編號。"}
                </span>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>課程編號</span>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="例如：1412725"
                className={inputClass}
              />
            </label>

            <button
              onClick={handleGetRollcall}
              disabled={!courseId || getLoading}
              className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getLoading && <Spinner />}
              {getLoading ? "擷取中…" : "取得點名"}
            </button>

            {getError && <StatusBanner kind="error">{getError}</StatusBanner>}

            {getResponse && (
              <>
                {getResponse.status === true ? (
                  <StatusBanner kind="success">
                    找到進行中的點名。
                  </StatusBanner>
                ) : (
                  <StatusBanner kind="error">
                    {typeof getResponse.message === "string"
                      ? getResponse.message
                      : "這門課程目前沒有進行中的點名。"}
                  </StatusBanner>
                )}

                {rollcallIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rollcallIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          setRollcallId(id);
                          document
                            .getElementById("rollcall-id-input")
                            ?.focus();
                        }}
                        className="border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                      >
                        使用 #{id}
                      </button>
                    ))}
                  </div>
                )}

                <RawJson data={getResponse} />
              </>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-3">
          <Panel
            title="進行點名"
            delay={120}
            className="lg:sticky lg:top-[4.5rem]"
          >
            <MapComponent
              center={position}
              zoom={15}
              position={position}
              onClick={handleMapClick}
              className="h-[360px] w-full"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted">點擊地圖設定您的位置。</p>
              <button
                onClick={copyCoords}
                className="flex shrink-0 items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5 text-success" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                {copied ? "已複製" : "複製"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>緯度</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={latInput}
                  onChange={(e) => handleCoordInput("lat", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </label>
              <label className="block">
                <span className={labelClass}>經度</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lngInput}
                  onChange={(e) => handleCoordInput("lng", e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>點名編號</span>
              <input
                id="rollcall-id-input"
                type="text"
                inputMode="numeric"
                value={rollcallId}
                onChange={(e) => setRollcallId(e.target.value)}
                placeholder="例如：2048265"
                className={inputClass}
              />
            </label>

            <button
              onClick={handleMakeRollcall}
              disabled={!rollcallId || postLoading}
              className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {postLoading && <Spinner />}
              {postLoading ? "簽到中…" : "簽到"}
            </button>

            {postError && <StatusBanner kind="error">{postError}</StatusBanner>}

            {postResponse && (
              <>
                {postResponse.status === true ? (
                  <StatusBanner kind="success">
                    簽到成功
                    {typeof postResponse.message === "string" &&
                      ` — ${postResponse.message}`}
                  </StatusBanner>
                ) : (
                  <StatusBanner kind="error">
                    簽到失敗
                    {typeof postResponse.message === "string" &&
                      ` — ${postResponse.message}`}
                  </StatusBanner>
                )}
                <RawJson data={postResponse} />
              </>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}
