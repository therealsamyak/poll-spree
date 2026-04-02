import { BarChart3 } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
}

export const ErrorFallback = ({ error }: ErrorFallbackProps) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="bg-destructive/10 mb-2 flex h-20 w-20 items-center justify-center rounded-full">
        <BarChart3 className="text-destructive h-10 w-10" />
      </div>
      <h1 className="text-destructive text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
)
