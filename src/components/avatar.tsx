import { useUser } from "@clerk/clerk-react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarProps {
  userId?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Avatar = ({ userId, size = "md", className }: AvatarProps) => {
  const { user } = useUser()

  // Get the profile image URL from Clerk
  const profileImageUrl = user?.imageUrl

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/30",
        sizeClasses[size],
        className,
      )}
    >
      {profileImageUrl ? (
        <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <User className={cn("text-primary", iconSizes[size])} />
      )}
    </div>
  )
}
