import type { PollOption } from "@/types"

export const formatDateTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString("en-US", {
    day: "numeric",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const getVotePercentage = (votes: number, totalVotes: number) => {
  if (totalVotes === 0) {
    return 0
  }
  return Math.round((votes / totalVotes) * 100)
}

export const getOptionsWithPlaces = (options: PollOption[]) =>
  options.map((option) => ({ option, place: undefined }))
