import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { UserPolls } from "@/components/user-polls"

const searchSchema = z.object({
  filter: z.string().optional(),
  sort: z.enum(["recent", "oldest", "most-voted", "least-voted"]).optional(),
})

export const Route = createFileRoute("/users/$username")({
  component: UserPolls,
  validateSearch: searchSchema,
})
