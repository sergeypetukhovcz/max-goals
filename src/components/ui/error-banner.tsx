"use client";

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
  className?: string;
}

/**
 * Dismissible error banner for surfacing failed operations to the user.
 * Supabase mutations do not throw — they return `{ error }` — so callers must
 * check the error and pass its message here instead of failing silently.
 */
export function ErrorBanner({ error, onDismiss, className = "" }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-red-800 bg-red-950 px-4 py-2 ${className}`}
    >
      <span className="text-sm text-red-400">{error}</span>
      <button onClick={onDismiss} className="ml-3 text-red-400 hover:text-red-300" aria-label="Zavřít">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
