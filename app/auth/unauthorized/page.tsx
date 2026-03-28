export default function Unauthorized() {
  return (
    <div className="crt-screen min-h-screen flex items-center justify-center bg-crt-bg px-4">
      <div className="max-w-md w-full space-y-8 p-8 crt-panel rounded-sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full border border-crt-danger-dim bg-crt-bar-track">
            <svg
              className="h-6 w-6 text-crt-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-crt-phosphor-bright tracking-wide crt-text-plain">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-crt-muted crt-text-plain">
            Your GitHub account is not authorized to access this application.
            Please contact the administrator if you believe this is an error.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/login"
            className="w-full flex justify-center py-2 px-4 crt-btn crt-btn-primary rounded-sm text-sm font-medium transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}


