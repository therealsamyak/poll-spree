import { SignUp } from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"

const SignUpPage = () => {
  const [redirectUrl, setRedirectUrl] = useState("/")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get("redirect_url")
      setRedirectUrl(redirect || "/")
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignUp fallbackRedirectUrl={redirectUrl} signInFallbackRedirectUrl={redirectUrl} />
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            search={redirectUrl !== "/" ? { redirect_url: redirectUrl } : undefined}
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
