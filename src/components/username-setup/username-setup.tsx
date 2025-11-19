import { useAuth, useUser } from "@clerk/clerk-react"
import { useMutation } from "convex/react"
import { ArrowRight, Sparkles, User } from "lucide-react"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/components/ui/notification"
import { isTextSafe } from "@/lib/badWordsFilter"
import { isReservedUsername, validateUsername } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

export const UsernameSetup = () => {
  const [username, setUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userId } = useAuth()
  const { user } = useUser()
  const usernameId = useId()
  const { showNotification, showSignInNotification } = useNotification()

  const createUser = useMutation(api.users.createUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate username using comprehensive validation
    const validation = validateUsername(username)
    if (!validation.isValid) {
      showNotification({ message: validation.error || "Invalid username", variant: "error" })
      return
    }

    // Check for inappropriate content in username
    if (!isTextSafe(username)) {
      showNotification({
        message: "Username contains inappropriate content and cannot be used.",
        variant: "error",
      })
      return
    }

    // Check for reserved usernames
    if (isReservedUsername(username)) {
      showNotification({
        message: "This username is reserved and cannot be used.",
        variant: "error",
      })
      return
    }

    if (!userId) {
      showSignInNotification({
        message: "Please sign in to continue",
        onSignIn: () => {
          sessionStorage.setItem("redirectAfterSignIn", window.location.pathname)
          const redirectUrl = encodeURIComponent(window.location.pathname)
          window.location.href = `/sign-in?redirect_url=${redirectUrl}`
        },
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createUser({
        userId,
        username: username.trim(),
        profileImageUrl: user?.imageUrl,
      })

      if (result.success) {
        showNotification({ message: "Username set successfully!", variant: "success" })
      } else {
        showNotification({ message: result.error || "Failed to set username", variant: "error" })
      }
    } catch (_error) {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-6 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-2xl text-transparent">
              Welcome to PollSpree!
            </CardTitle>
            <CardDescription className="text-base">
              Choose a username to get started with creating and voting on polls
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={usernameId} className="font-medium text-sm">
                  Username
                </Label>
                <Input
                  id={usernameId}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-base"
                  maxLength={20}
                  required
                />
                <p className="text-muted-foreground text-xs">
                  English letters, numbers, underscores, and hyphens only (3-20 characters)
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !username.trim()}
                className="h-12 w-full gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:from-primary/90 hover:to-primary/70"
              >
                {isSubmitting ? (
                  "Setting username..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>Your username will be visible to other users</span>
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
