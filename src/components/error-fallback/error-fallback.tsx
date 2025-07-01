interface ErrorFallbackProps {
  error: Error
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-2xl text-destructive">Something went wrong</h1>
        <p className="mb-4 text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
