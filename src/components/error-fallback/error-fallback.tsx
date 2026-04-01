import { BarChart3 } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <BarChart3 className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="font-bold text-2xl text-destructive tracking-tight">
          Something went wrong
        </h1>
        <p className="text-muted-foreground">
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
