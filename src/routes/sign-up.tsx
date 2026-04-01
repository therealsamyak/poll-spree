import { SignUp } from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  redirect_url: z.string().optional(),
})

const SignUpPage = () => {
  const search = Route.useSearch()
  const redirectUrl = search.redirect_url || "/"

  // Decode the redirect URL if it's encoded
  const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/"

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignUp
          fallbackRedirectUrl={decodedRedirectUrl}
          signInFallbackRedirectUrl={decodedRedirectUrl}
        />
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            search={
              decodedRedirectUrl !== "/"
                ? { redirect_url: decodedRedirectUrl }
                : undefined
            }
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
  validateSearch: searchSchema,
})
