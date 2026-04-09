function FullPageSpinner(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,71,116,0.16),_transparent_45%),linear-gradient(180deg,#f6f3ec_0%,#ece6da_100%)]">
      <svg
        className="h-8 w-8 animate-spin text-brand-deep"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}

export { FullPageSpinner }
