import { SignInButton } from "@clerk/tanstack-react-start"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SignInModal = ({ isOpen, onClose }: SignInModalProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 tracking-tight">
          <LogIn className="h-5 w-5" />
          Sign In Required
        </DialogTitle>
        <DialogDescription>
          Sign in to vote, comment, and create polls
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex-col gap-3 sm:flex-row sm:gap-2">
        <SignInButton mode="modal">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 sm:flex-1">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </SignInButton>
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:flex-1"
        >
          Maybe Later
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
