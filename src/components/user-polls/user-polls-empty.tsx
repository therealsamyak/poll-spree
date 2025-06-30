import { BarChart3, UserX } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type EmptyStateType = "user-not-found" | "no-polls" | "no-results"

interface UserPollsEmptyProps {
  type: EmptyStateType
  username: string
  filters?: ("authored" | "voted")[]
}

export const UserPollsEmpty = ({ type, username, filters }: UserPollsEmptyProps) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case "user-not-found":
        return {
          icon: UserX,
          title: "User does not exist",
          description: `The user "${username}" could not be found.`,
        }
      case "no-polls":
        return {
          icon: BarChart3,
          title: "No polls yet",
          description: `${username} has not created or voted on any polls.`,
        }
      case "no-results": {
        const filterLabels = filters?.map((f) => (f === "authored" ? "authored" : "voted on")) || []
        const filterText = filterLabels.length === 1 ? filterLabels[0] : filterLabels.join(" or ")

        return {
          icon: BarChart3,
          title: "No results match your filters",
          description: `${username} has no polls that you've ${filterText}.`,
        }
      }
    }
  }

  const content = getEmptyStateContent()
  const IconComponent = content.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold text-4xl text-transparent sm:text-5xl">
              {username}'s Polls
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <Card className="mx-auto w-full max-w-md border-2 border-muted-foreground/20 border-dashed text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <IconComponent className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="font-bold text-2xl">{content.title}</CardTitle>
              <CardDescription className="text-base">{content.description}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
