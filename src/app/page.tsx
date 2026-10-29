"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  CrosshairIcon,
  RefreshIcon,
  SearchIcon,
  PowerIcon,
  CopyIcon,
  CheckIcon,
} from "../components/icons";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[380px] w-full place-items-center bg-panel2">
      <span className="animate-pulse font-mono text-xs tracking-[0.3em] text-muted">
        ACQUIRING MAP…
      </span>
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

/** Recursively collect every `rollcall_id` value in an API response. */
function extractRollcallIds(input: unknown, found = new Set<string>()): string[] {
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
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent ${className}`}
    />
  );
}

function Panel({
  index,
  title,
  aside,
  children,
  delay = 0,
  className = "",
}: {
  index: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section
      className={`rise border border-line bg-panel ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="shrink-0 font-mono text-[11px] tracking-widest text-accent">
            {index}
          </span>
          <h2 className="truncate whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink">
            {title}
          </h2>
        </div>
        {aside}
      </header>
      <div className="space-y-4 p-5">{children}</div>
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
      ? "border-accent/40 bg-accent/10 text-accent"
      : "border-danger/40 bg-danger/10 text-danger";
  return (
    <div
      className={`rise border px-4 py-3 font-mono text-xs leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}

function RawJson({ data }: { data: unknown }) {
  return (
    <details className="group border border-line bg-panel2">
      <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 font-mono text-[11px] tracking-widest text-muted transition-colors hover:text-ink">
        RAW RESPONSE
        <span className="transition-transform group-open:rotate-90">▸</span>
      </summary>
      <pre className="raw-json max-h-72 overflow-auto border-t border-line p-4 font-mono text-[11px] leading-relaxed text-muted">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

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
        setCoursesError(data.message || "Session rejected by Zuvio.");
      }
    } catch {
      setCoursesError("Network error while fetching courses.");
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
      setGetError("Network error while fetching rollcall.");
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
      setPostError("Network error while transmitting check-in.");
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
        <span className="animate-pulse font-mono text-xs tracking-[0.3em] text-muted">
          ESTABLISHING UPLINK…
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="grid h-9 w-9 place-items-center border border-accent/60 bg-accent/10">
              <CrosshairIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="whitespace-nowrap font-display text-sm font-bold tracking-[0.22em] text-ink sm:text-base">
                ROLLCALL<span className="text-accent">://</span>CONSOLE
              </p>
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">
                ZUVIO FIELD CLIENT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 border border-line bg-panel px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <span className="font-mono text-[11px] tracking-widest text-muted">
                ID {userId}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-line px-3 py-1.5 font-mono text-[11px] tracking-widest text-muted transition-colors hover:border-danger/60 hover:text-danger"
            >
              <PowerIcon className="h-3.5 w-3.5" />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel
            index="01"
            title="Courses"
            delay={0}
            aside={
              <button
                onClick={fetchCourses}
                disabled={loadingCourses}
                className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted transition-colors hover:text-accent disabled:opacity-50"
              >
                <RefreshIcon
                  className={`h-3.5 w-3.5 ${loadingCourses ? "animate-spin" : ""}`}
                />
                REFRESH
              </button>
            }
          >
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="FILTER BY NAME, INSTRUCTOR OR ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-line bg-panel2 py-2.5 pl-10 pr-3 font-mono text-xs tracking-wider text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
              />
            </div>

            {coursesError && (
              <StatusBanner kind="error">
                <p>SESSION FAULT — {coursesError}</p>
                <button
                  onClick={() => router.replace("/login")}
                  className="mt-1 underline underline-offset-2 transition-colors hover:text-ink"
                >
                  RE-AUTHENTICATE →
                </button>
              </StatusBanner>
            )}

            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              {loadingCourses ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse border border-line bg-panel2 px-4 py-3"
                  >
                    <div className="h-3.5 w-2/3 rounded bg-line" />
                    <div className="mt-2 h-2.5 w-1/3 rounded bg-line" />
                  </div>
                ))
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const active = String(course.course_id) === courseId;
                  return (
                    <button
                      key={course.course_id}
                      onClick={() => setCourseId(String(course.course_id))}
                      className={`group w-full border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-accent/60 bg-accent/[0.06]"
                          : "border-line bg-panel2 hover:border-muted/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-semibold tracking-wide text-ink">
                            {course.course_name}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                            {course.instructor_name} · ID {course.course_id}
                          </p>
                        </div>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                            active
                              ? "bg-accent shadow-[0_0_8px_rgba(205,245,72,0.9)]"
                              : "bg-line group-hover:bg-muted"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="border border-dashed border-line px-4 py-8 text-center font-mono text-[11px] tracking-widest text-muted">
                  {courses.length === 0 && !coursesError
                    ? "NO COURSES THIS SEMESTER"
                    : "NO MATCH — CLEAR THE FILTER"}
                </div>
              )}
            </div>

            <p className="font-mono text-[10px] tracking-[0.25em] text-muted/70">
              {loadingCourses
                ? "SYNCING…"
                : `${filteredCourses.length}/${courses.length} COURSES`}
            </p>
          </Panel>

          <Panel index="02" title="Fetch Rollcall" delay={80}>
            <div className="border border-line bg-panel2 px-4 py-3 font-mono text-xs">
              {selectedCourse ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink">
                    {selectedCourse.course_name}
                  </span>
                  <span className="shrink-0 text-accent">
                    #{selectedCourse.course_id}
                  </span>
                </div>
              ) : (
                <span className="tracking-wider text-muted">
                  {courseId
                    ? `MANUAL TARGET #${courseId}`
                    : "NO COURSE SELECTED — PICK ONE ABOVE"}
                </span>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
                COURSE ID
              </span>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="OR TYPE A COURSE ID MANUALLY"
                className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
              />
            </label>

            <button
              onClick={handleGetRollcall}
              disabled={!courseId || getLoading}
              className="notched flex w-full items-center justify-center gap-2.5 bg-accent px-4 py-3 font-display text-sm font-bold tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {getLoading && <Spinner />}
              {getLoading ? "SCANNING…" : "FETCH ACTIVE ROLLCALL"}
            </button>

            {getError && <StatusBanner kind="error">{getError}</StatusBanner>}

            {getResponse && (
              <>
                {getResponse.status === true ? (
                  <StatusBanner kind="success">
                    SIGNAL LOCKED — ROLLCALL DATA RECEIVED.
                  </StatusBanner>
                ) : (
                  <StatusBanner kind="error">
                    {typeof getResponse.message === "string"
                      ? getResponse.message
                      : "NO ACTIVE ROLLCALL FOR THIS COURSE."}
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
                        className="border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20"
                      >
                        USE #{id} →
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
            index="03"
            title="Transmit Check-In"
            delay={160}
            className="lg:sticky lg:top-24"
            aside={
              <span className="shrink-0 whitespace-nowrap font-mono text-[10px] tracking-widest text-muted sm:text-[11px]">
                DEVICE · WEB
              </span>
            }
          >
            <div className="relative border border-line">
              <MapComponent
                center={position}
                zoom={15}
                position={position}
                onClick={handleMapClick}
                className="h-[380px] w-full"
              />
              <div className="pointer-events-none absolute left-3 top-3 z-[1000] border border-line bg-bg/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted backdrop-blur">
                <div>
                  LAT <span className="text-accent">{position[0].toFixed(6)}</span>
                </div>
                <div>
                  LNG <span className="text-accent">{position[1].toFixed(6)}</span>
                </div>
              </div>
              <span className="pointer-events-none absolute left-0 top-0 z-[1000] h-4 w-4 border-l-2 border-t-2 border-accent" />
              <span className="pointer-events-none absolute right-0 top-0 z-[1000] h-4 w-4 border-r-2 border-t-2 border-accent" />
              <span className="pointer-events-none absolute bottom-0 left-0 z-[1000] h-4 w-4 border-b-2 border-l-2 border-accent" />
              <span className="pointer-events-none absolute bottom-0 right-0 z-[1000] h-4 w-4 border-b-2 border-r-2 border-accent" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted">
                ▸ CLICK MAP TO PLACE PIN — DRAG TO PAN
              </p>
              <button
                onClick={copyCoords}
                className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-muted transition-colors hover:text-accent"
              >
                {copied ? (
                  <CheckIcon className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <CopyIcon className="h-3.5 w-3.5" />
                )}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
                  LATITUDE
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={latInput}
                  onChange={(e) => handleCoordInput("lat", e.target.value)}
                  className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-accent outline-none transition-colors focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
                  LONGITUDE
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lngInput}
                  onChange={(e) => handleCoordInput("lng", e.target.value)}
                  className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-accent outline-none transition-colors focus:border-accent"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-muted">
                ROLLCALL ID
              </span>
              <input
                id="rollcall-id-input"
                type="text"
                inputMode="numeric"
                value={rollcallId}
                onChange={(e) => setRollcallId(e.target.value)}
                placeholder="e.g. 2048265"
                className="w-full border border-line bg-panel2 px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent"
              />
            </label>

            <button
              onClick={handleMakeRollcall}
              disabled={!rollcallId || postLoading}
              className="notched flex w-full items-center justify-center gap-2.5 bg-accent px-4 py-3.5 font-display text-sm font-bold tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {postLoading && <Spinner />}
              {postLoading ? "TRANSMITTING…" : "TRANSMIT CHECK-IN"}
            </button>

            {postError && <StatusBanner kind="error">{postError}</StatusBanner>}

            {postResponse && (
              <>
                {postResponse.status === true ? (
                  <StatusBanner kind="success">
                    ✓ CHECK-IN CONFIRMED
                    {typeof postResponse.message === "string" &&
                      ` — ${postResponse.message}`}
                  </StatusBanner>
                ) : (
                  <StatusBanner kind="error">
                    CHECK-IN REJECTED
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
