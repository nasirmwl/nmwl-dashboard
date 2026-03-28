export default function AuthCodeError() {
  return (
    <div className="crt-screen min-h-screen flex items-center justify-center bg-crt-bg px-4">
      <div className="max-w-md w-full space-y-8 p-8 crt-panel rounded-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-crt-phosphor-bright tracking-wide crt-text-plain">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-crt-muted crt-text-plain">
            There was an error authenticating. Please try again.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="w-full flex justify-center py-2 px-4 crt-btn crt-btn-primary rounded-sm text-sm font-medium transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  )
}


