export const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-4xl text-foreground">404</h1>
        <p className="mb-4 text-muted-foreground text-xl">Page not found</p>
        <p className="mb-6 text-muted-foreground">
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
