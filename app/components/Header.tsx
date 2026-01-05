import AuthButton from './AuthButton'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 sm:py-4 max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
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

