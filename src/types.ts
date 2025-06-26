import type { Id } from "../convex/_generated/dataModel"

export interface PollOption {
  id: string
  pollId: string
  text: string
  votes: number
  votedUserIds: string[]
}

export interface Poll {
  id: string
  question: string
  totalVotes: number
  dev: boolean
  authorId: string
  authorUsername: string
  createdAt: number
  options: PollOption[]
}

export interface PollWithOptionsType extends Poll {}

export interface User {
  userId: string
  username: string
  createdAt: number
}

export interface CreatePollData {
  question: string
  options: string[]
  authorId: string
  authorUsername: string
  dev?: boolean
}

export type VoteRequest = {
  optionId: Id<"pollOptions">
}

export type VoteResponse = {
  success: boolean
  poll: PollWithOptionsType
}
