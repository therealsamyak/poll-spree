import { SignInButton, useAuth } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { BarChart3, Heart, Loader2, Plus, Users } from "lucide-react"
import { SiGithub, SiX } from "react-icons/si"
import { CreatePollDialog } from "@/components/create-poll-dialog"
import { PollCard } from "@/components/poll-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "../../../convex/_generated/api"

export const PollsList = () => {
  const polls = useQuery(api.polls.getPolls)
  const { isSignedIn } = useAuth()

  if (polls === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading polls...</p>
        </div>
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-md border-2 border-muted-foreground/20 border-dashed text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="font-bold text-2xl">No polls yet</CardTitle>
            <CardDescription className="text-base">
              Be the first to create a poll and start the conversation!
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {isSignedIn ? (
              <CreatePollDialog />
            ) : (
              <SignInButton mode="modal">
                <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-4 w-4" />
                  Sign in to create polls
                </Button>
              </SignInButton>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0)
  const totalPolls = polls.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-4xl text-transparent sm:text-5xl">
              Community Polls
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
              Vote on polls and see what the community thinks. Your opinion matters!
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center space-x-8 pt-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">{totalPolls} polls</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="font-medium">{totalVotes} votes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Create Button */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h2 className="font-bold text-2xl">Recent Polls</h2>
            <p className="text-muted-foreground">Join the conversation and make your voice heard</p>
          </div>
          {isSignedIn && <CreatePollDialog />}
        </div>

        {/* Polls Grid */}
        <div className="space-y-6">
          {polls.map((poll, index) => (
            <div
              key={poll.id}
              className="slide-in-from-bottom-4 animate-in duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PollCard poll={poll} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t pt-8">
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center space-x-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <SiGithub className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <SiX className="h-5 w-5" />
              </a>
            </div>
            <div className="space-y-2">
              <p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                Made with <Heart className="h-4 w-4 text-red-500" /> for the community
              </p>
              <p className="text-muted-foreground text-xs">
                © 2025 Poll Spree. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
