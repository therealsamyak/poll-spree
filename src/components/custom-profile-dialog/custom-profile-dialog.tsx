import { useClerk, useUser } from "@clerk/clerk-react"
import { useAction, useMutation } from "convex/react"
import { AlertTriangle, Camera, LogOut, Trash2, User } from "lucide-react"
import { useRef, useState } from "react"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useNotification } from "@/components/ui/notification"
import { Separator } from "@/components/ui/separator"
import { api } from "../../../convex/_generated/api"

interface CustomProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const CustomProfileDialog = ({
  isOpen,
  onClose,
}: CustomProfileDialogProps) => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showNotification } = useNotification()

  const deleteUserData = useMutation(api.users.deleteAccount)
  const deleteClerkUser = useAction(api.users.deleteClerkUser)
  const updateProfileImage = useMutation(api.users.updateProfileImage)

  const handleSignOut = async () => {
    try {
      await signOut()
      onClose()
      showNotification({
        message: "Signed out successfully",
        variant: "success",
      })
    } catch (_error) {
      showNotification({ message: "Failed to sign out", variant: "error" })
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setIsDeleting(true)
    try {
      const userId = user.id

      // Step 1: Delete user data from Convex
      await deleteUserData({ userId })

      // Step 2: Delete user from Clerk
      await deleteClerkUser({ userId })

      // Step 3: Sign out the user
      await signOut()

      // Step 4: Refresh the page to clear any remaining state
      window.location.reload()
    } catch (_error) {
      showNotification({
        message: "Failed to delete account. Please try again.",
        variant: "error",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification({
        message: "Please select an image file",
        variant: "error",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification({
        message: "Image size must be less than 5MB",
        variant: "error",
      })
      return
    }

    setIsUploading(true)
    try {
      // Use Clerk's setProfileImage method
      await user.setProfileImage({ file })

      // Also update our Convex users table with the new profile image URL
      // We need to wait a moment for Clerk to update the imageUrl
      setTimeout(async () => {
        try {
          await updateProfileImage({
            userId: user.id,
            profileImageUrl: user.imageUrl || "",
          })
        } catch (_error) {
          // Don't show error to user as the main operation succeeded
        }
      }, 1000)

      showNotification({
        message: "Profile picture updated successfully!",
        variant: "success",
      })
    } catch (_error) {
      showNotification({
        message: "Failed to upload profile picture. Please try again.",
        variant: "error",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!user) return

    setIsUploading(true)
    try {
      // Use Clerk's setProfileImage method with null to remove
      await user.setProfileImage({ file: null })

      // Also update our Convex users table to remove the profile image URL
      // We need to wait a moment for Clerk to update the imageUrl
      setTimeout(async () => {
        try {
          await updateProfileImage({
            userId: user.id,
            profileImageUrl: "",
          })
        } catch (_error) {
          // Don't show error to user as the main operation succeeded
        }
      }, 1000)

      showNotification({
        message: "Profile picture removed successfully!",
        variant: "success",
      })
    } catch (_error) {
      showNotification({
        message: "Failed to remove profile picture. Please try again.",
        variant: "error",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Picture Section */}
          <div className="space-y-3">
            <h4 className="font-medium">Profile Picture</h4>
            <div className="flex items-center gap-4">
              <Avatar size="lg" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                  {user?.imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveProfilePicture}
                      disabled={isUploading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Upload a JPG, PNG, or GIF file (max 5MB)
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>

          <Separator />

          {/* User Info */}
          <div className="space-y-2">
            <h4 className="font-medium">Account Information</h4>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-sm">
                <span className="font-medium">Email:</span>{" "}
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-sm">
                <span className="font-medium">Name:</span>{" "}
                {user?.fullName || "Not set"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="font-medium">Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and all associated data including:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
              <li>All polls you've created</li>
              <li>All votes you've cast</li>
              <li>Your username and profile data</li>
              <li>Your account credentials</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
