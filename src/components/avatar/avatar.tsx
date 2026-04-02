import { useUser } from "@clerk/clerk-react"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"

interface AvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
  profileImageUrl?: string
}

const sizeClasses = {
  lg: "h-12 w-12",
  md: "h-8 w-8",
  sm: "h-6 w-6",
} as const

const iconSizes = {
  lg: "h-6 w-6",
  md: "h-4 w-4",
  sm: "h-3 w-3",
} as const

export const Avatar = ({
  size = "md",
  className,
  profileImageUrl,
}: AvatarProps) => {
  const { user } = useUser()

  // Use the provided profile image URL or fall back to the current user's image
  const imageUrl = profileImageUrl || user?.imageUrl

  return (
    <div
      className={cn(
        "bg-muted ring-border hover:ring-primary/50 flex items-center justify-center overflow-hidden rounded-full ring-2",
        sizeClasses[size],
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={cn("text-muted-foreground", iconSizes[size])} />
      )}
    </div>
  )
}
