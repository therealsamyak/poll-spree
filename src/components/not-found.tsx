export const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-4xl text-gray-900 dark:text-white">404</h1>
        <p className="mb-4 text-gray-600 text-xl dark:text-gray-400">Page not found</p>
        <p className="mb-6 text-gray-500 dark:text-gray-500">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
