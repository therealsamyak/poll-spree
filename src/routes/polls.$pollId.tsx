import { useAuth } from "@clerk/tanstack-react-start"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { BarChart3, Calendar, Eye, Heart, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"

import { Avatar } from "@/components/avatar"
import { CommentSection } from "@/components/comments/comment-section"
import { SEOHead } from "@/components/seo"
import { Button } from "@/components/ui/button"
import { useNotification } from "@/components/ui/notification"
import { usePollActions } from "@/hooks/usePollActions"
import { formatDateTime, getVotePercentage } from "@/lib/poll-utils"
import { generatePollSEOConfig } from "@/lib/seo"

import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface PollOption {
  id: string
  text: string
  votes: number
}

const getOptionsWithUserVoteFirst = (
  options: PollOption[],
  userVotedOptionId: string | null | undefined,
): PollOption[] => {
  if (!userVotedOptionId) return options
  const userOption = options.find((o) => o.id === userVotedOptionId)
  if (!userOption) return options
  return [userOption, ...options.filter((o) => o.id !== userVotedOptionId)]
}

const PollPage = () => {
  const { pollId } = Route.useParams()
  const { userId, isSignedIn } = useAuth()
  const router = useRouter()
  const { showNotification, showSignInNotification } = useNotification()

  const poll = useSuspenseQuery(
    convexQuery(api.polls.getPoll, { pollId: pollId as Id<"polls"> }),
  )
  const userVote = useQuery(
    convexQuery(api.polls.getUserVote, {
      pollId: pollId as Id<"polls">,
      userId: userId || "",
    }),
  )
  const currentUser = useQuery(
    convexQuery(api.users.getUser, { userId: userId || "" }),
  )
  const vote = useMutation(api.polls.vote)
  const deletePoll = useMutation(api.polls.deletePoll)
  const viewPoll = useMutation(api.polls.viewPoll)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (pollId && !hasTrackedView.current) {
      viewPoll({ pollId: pollId as Id<"polls"> })
      hasTrackedView.current = true
    }
  }, [pollId, viewPoll])

  if (poll.data === null) {
    throw notFound()
  }

  const pollData = poll.data
  const hasVoted =
    userVote.data?.optionId !== null && userVote.data?.optionId !== undefined
  const canDelete = currentUser.data && poll.data?.authorId === userId
  const isAuthor = poll.data?.authorId === userId
  const isUserVoteLoading = userVote.data === undefined && isSignedIn
  const showResults = !isUserVoteLoading && isSignedIn && (hasVoted || isAuthor)

  const { handleVote, handleDelete, isVoting, isDeleting } = usePollActions({
    pollId: pollData.id,
    userId,
    isSignedIn,
    userVote: {
      optionId: userVote.data?.optionId ?? null,
      pollId,
    },
    vote,
    deletePoll,
    onPollDeleted: () => router.navigate({ to: "/" }),
    showNotification,
    showSignInNotification,
  })

  const seoConfig = generatePollSEOConfig(pollData)

  return (
    <>
      <SEOHead
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={seoConfig.canonical}
        structuredData={{
          pollData: seoConfig.pollData,
          type: "Poll",
        }}
      />
      <div className="container mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              {/* Question */}
              <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight wrap-break-word">
                {poll.data?.question}
              </h1>

              {/* Metadata */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/users/$username"
                    params={{ username: poll.data?.authorUsername }}
                    className="flex items-center gap-1.5 hover:underline hover:opacity-80"
                  >
                    <Avatar
                      size="sm"
                      profileImageUrl={poll.data?.authorProfileImageUrl}
                    />
                    <span className="font-medium">
                      {poll.data?.authorUsername}
                    </span>
                  </Link>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <Calendar className="text-primary h-3 w-3" />
                  </div>
                  <span>{formatDateTime(poll.data?.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <BarChart3 className="text-primary h-3 w-3" />
                  </div>
                  <span className="font-medium">
                    {poll.data?.totalVotes} votes
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <Heart className="text-primary h-3 w-3" />
                  </div>
                  <span className="font-medium">
                    {poll.data?.likes || 0} likes
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                    <Eye className="text-primary h-3 w-3" />
                  </div>
                  <span className="font-medium">
                    {poll.data?.views || 0} views
                  </span>
                </div>
              </div>
            </div>

            {/* Delete button */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sign in prompt for non-signed in users */}
          {!isSignedIn && (
            <div className="border-border/50 bg-card rounded-xl border p-4 text-center">
              <p className="text-muted-foreground">
                Sign in to vote on this poll and see real-time results!
              </p>
            </div>
          )}

          {/* Voting Options */}
          <div className="space-y-4">
            <div className="grid gap-4">
              {getOptionsWithUserVoteFirst(
                poll.data?.options ?? [],
                userVote.data?.optionId,
              ).map((option) => {
                const isSelected =
                  !isUserVoteLoading && userVote.data?.optionId === option.id

                return (
                  <Button
                    key={option.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`flex h-auto w-full items-center justify-between rounded-xl border p-6 text-lg font-medium ${
                      isSelected
                        ? "border-primary bg-primary/80 text-primary-foreground ring-primary/20 hover:text-primary-foreground shadow-lg ring-2"
                        : "border-border bg-card text-foreground hover:bg-primary/10 hover:text-primary"
                    } hover:border-primary`}
                    onClick={() => handleVote(option.id)}
                    disabled={isVoting || isUserVoteLoading}
                    style={{
                      borderColor: isSelected ? "var(--primary)" : undefined,
                      minHeight: 64,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    <span className="text-foreground flex w-full flex-col items-start gap-2">
                      <span className="flex w-full items-center">
                        <span
                          className="text-lg wrap-break-word whitespace-pre-line"
                          style={{ wordBreak: "break-word" }}
                        >
                          {option.text}
                        </span>
                      </span>
                      {showResults && (
                        <span className="text-foreground mt-2 text-sm">
                          {getVotePercentage(
                            option.votes,
                            poll.data?.totalVotes ?? 0,
                          )}
                          % • {option.votes} vote
                          {option.votes === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Results hidden message for signed in users who haven't voted */}
          {isSignedIn && !isUserVoteLoading && !hasVoted && !isAuthor && (
            <div className="border-border/50 bg-card rounded-xl border p-4 text-center">
              <p className="text-muted-foreground">
                Vote to see the current results!
              </p>
            </div>
          )}

          <div className="border-border/50 border-t pt-8">
            <CommentSection pollId={pollId} currentUser={currentUser.data} />
          </div>
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute("/polls/$pollId")({
  loader: async (opts) => {
    const { pollId } = opts.params
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.polls.getPoll, { pollId: pollId as Id<"polls"> }),
    )
  },
  component: PollPage,
})
