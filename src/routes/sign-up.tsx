import { SignUp } from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"

const SignUpPage = () => {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
  const redirectUrl = params.get("redirect_url") || "/"

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
            search={decodedRedirectUrl !== "/" ? { redirect_url: decodedRedirectUrl } : undefined}
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
})
