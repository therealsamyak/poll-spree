import { SignIn } from "@clerk/clerk-react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  redirect_url: z.string().optional(),
})

const SignInPage = () => {
  const search = Route.useSearch()
  const redirectUrl = search.redirect_url || "/"

  // Decode the redirect URL if it's encoded
  const decodedRedirectUrl = redirectUrl ? decodeURIComponent(redirectUrl) : "/"

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn
          fallbackRedirectUrl={decodedRedirectUrl}
          signUpFallbackRedirectUrl={decodedRedirectUrl}
        />
        <div className="mt-4 text-center text-sm tracking-tight">
          Don't have an account?{" "}
          <Link
            to="/sign-up"
            search={
              decodedRedirectUrl !== "/"
                ? { redirect_url: decodedRedirectUrl }
                : undefined
            }
            className="text-primary font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
  validateSearch: searchSchema,
})
