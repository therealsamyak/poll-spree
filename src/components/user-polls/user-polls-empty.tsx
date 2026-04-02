import { BarChart3, UserX } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type EmptyStateType = "user-not-found" | "no-polls" | "no-results"

interface UserPollsEmptyProps {
  type: EmptyStateType
  username: string
  filters?: ("authored" | "voted")[]
  currentUserUsername?: string
}

export const UserPollsEmpty = ({
  type,
  username,
  filters,
  currentUserUsername,
}: UserPollsEmptyProps) => {
  const isOwnProfile = currentUserUsername === username

  const getEmptyStateContent = () => {
    switch (type) {
      case "user-not-found": {
        return {
          icon: UserX,
          title: "User does not exist",
          description: `The user "${username}" could not be found.`,
        }
      }
      case "no-polls": {
        return {
          icon: BarChart3,
          title: "No polls yet",
          description: isOwnProfile
            ? "You haven't created or voted on any polls yet."
            : `${username} has not created or voted on any polls.`,
        }
      }
      case "no-results": {
        const filterLabels =
          filters?.map((f) => (f === "authored" ? "authored" : "voted on")) ||
          []
        const filterText =
          filterLabels.length === 1
            ? filterLabels[0]
            : filterLabels.join(" or ")

        return {
          description: isOwnProfile
            ? `You have no polls that you've ${filterText}.`
            : `${username} has no polls that you've ${filterText}.`,
          icon: BarChart3,
          title: "No results match your filters",
        }
      }
    }
  }

  const content = getEmptyStateContent()
  const IconComponent = content.icon

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="border-primary/20 mx-auto w-full max-w-md border-2 border-dashed text-center">
        <CardHeader className="pb-4">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <IconComponent className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
          <CardDescription className="text-base">
            {content.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
