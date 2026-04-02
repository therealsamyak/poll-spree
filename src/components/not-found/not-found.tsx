import { BarChart3 } from "lucide-react"

export const NotFound = () => (
  <div className="bg-background flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="bg-primary/10 mb-2 flex h-20 w-20 items-center justify-center rounded-full">
        <BarChart3 className="text-primary h-10 w-10" />
      </div>
      <h1 className="text-foreground text-6xl font-bold tracking-tighter">
        404
      </h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 font-medium transition-colors"
      >
        Go home
      </a>
    </div>
  </div>
)
