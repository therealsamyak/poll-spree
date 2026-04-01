import { BarChart3 } from "lucide-react"

export const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-bold text-6xl text-foreground tracking-tighter">
          404
        </h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
