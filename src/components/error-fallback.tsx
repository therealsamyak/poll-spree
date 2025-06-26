interface ErrorFallbackProps {
  error: Error
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-2xl text-red-600">Something went wrong</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
