interface IconProps {
  className?: string;
}

function Base({
  className = "",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function CrosshairIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="1" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="23" y2="12" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function RefreshIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </Base>
  );
}

export function SearchIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Base>
  );
}

export function PowerIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <path d="M18.36 6.64a9 9 0 1 1-12.72 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </Base>
  );
}

export function CopyIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Base>
  );
}

export function CheckIcon({ className = "" }: IconProps) {
  return (
    <Base className={className}>
      <polyline points="20 6 9 17 4 12" />
    </Base>
  );
}
