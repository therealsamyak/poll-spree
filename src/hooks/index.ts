// Export any remaining hooks here
// The voting logic has been moved directly into the components for better integration

import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export const useUserProfile = (userId: string) => {
  return useQuery(api.polls.getUser, { userId })
}
