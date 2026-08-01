import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function IconFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      {children}
    </svg>
  );
}

export function WebIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M3 9h18" />
    </IconFrame>
  );
}

export function VideoIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path d="M10.5 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" />
    </IconFrame>
  );
}

export function GraphicsIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="10" cy="13.2" r="3.2" />
      <circle cx="14.5" cy="9.5" r="3.2" />
    </IconFrame>
  );
}
