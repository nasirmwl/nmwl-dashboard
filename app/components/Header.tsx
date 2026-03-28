import AuthButton from './AuthButton'

export default function Header() {
  return (
    <header className="bg-crt-panel border-b border-crt-border shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="mx-auto w-full max-w-[700px] px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-crt-phosphor-bright tracking-wide truncate crt-text-plain">
            Personal Dashboard
          </h1>
          <div className="shrink-0">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}

