import { SignInButton, useAuth, useClerk } from "@clerk/tanstack-react-start"
import { Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import {
  BarChart3,
  Edit,
  Home,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react"
import { Suspense, lazy, useId, useState } from "react"

import { Avatar } from "@/components/avatar"

const CreatePollDialogContent = lazy(() =>
  import("@/components/create-poll-dialog").then((m) => ({
    default: m.CreatePollDialogContent,
  })),
)
const CustomProfileDialog = lazy(() =>
  import("@/components/custom-profile-dialog").then((m) => ({
    default: m.CustomProfileDialog,
  })),
)

import { Loader } from "@/components/loader"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotification } from "@/components/ui/notification"
import { Separator } from "@/components/ui/separator"
import { isReservedUsername, validateUsername } from "@/lib/utils"

import { api } from "../../../convex/_generated/api"

const createPollIcon = <Plus className="text-primary h-5 w-5" />

export const Sidebar = () => (
  <aside className="bg-background fixed inset-y-0 z-50 flex max-h-screen w-16 flex-col border-r transition-colors md:w-64">
    <SidebarContent />
  </aside>
)

const SidebarContent = () => {
  const { isSignedIn, userId } = useAuth()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const user = useQuery(api.users.getUser, { userId: userId || "" })
  const randomPoll = useQuery(api.polls.getRandomPoll, {})
  const updateUsername = useMutation(api.users.updateUsername)
  const [newUsername, setNewUsername] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
  const { showNotification } = useNotification()

  const usernameId = useId()

  const handleSurprise = () => {
    if (randomPoll?.id) {
      navigate({ params: { pollId: randomPoll.id }, to: "/polls/$pollId" })
    }
  }

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !userId) {
      return
    }

    // Validate username using comprehensive validation
    const validation = validateUsername(newUsername)
    if (!validation.isValid) {
      showNotification({
        message: validation.error || "Invalid username",
        variant: "error",
      })
      return
    }

    // Check for reserved usernames
    if (isReservedUsername(newUsername)) {
      showNotification({
        message: "This username is reserved and cannot be used.",
        variant: "error",
      })
      return
    }

    try {
      const result = await updateUsername({
        userId,
        username: newUsername.trim(),
      })

      if (result.success) {
        setNewUsername("")
        setIsDialogOpen(false)
        showNotification({
          message: "Username updated successfully!",
          variant: "success",
        })
      } else {
        showNotification({
          message: result.error || "Failed to update username",
          variant: "error",
        })
      }
    } catch {
      showNotification({
        message: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUpdateUsername()
    }
  }

  return (
    <div className="bg-background flex h-full max-h-screen flex-col overflow-hidden border-r transition-colors">
      {/* Logo and Brand */}
      <div className="flex h-16 min-h-16 items-center justify-center border-b px-0 md:px-6">
        <Link
          to="/"
          className="flex h-16 w-16 items-center justify-center transition-opacity hover:opacity-80 md:h-auto md:w-auto md:space-x-3"
        >
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight md:inline">
            PollSpree
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto py-6 md:items-stretch md:gap-2 md:px-4">
        <Link
          to="/"
          className="text-foreground/90 hover:bg-accent hover:text-accent-foreground flex h-12 w-12 items-center justify-center rounded-lg text-sm font-medium transition-colors md:w-auto md:justify-start md:px-3"
        >
          <Home className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Home</span>
        </Link>
        {/* <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground md:w-auto md:justify-start md:px-3"
        >
          <TrendingUp className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Trending</span>
        </Link> */}
        <Link
          to="/trending"
          className="text-foreground/90 hover:bg-accent hover:text-accent-foreground flex h-12 w-12 items-center justify-center rounded-lg text-sm font-medium transition-colors md:w-auto md:justify-start md:px-3"
          activeProps={{
            className: "bg-primary/10 text-primary font-semibold",
          }}
        >
          <TrendingUp className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Trending</span>
        </Link>
        <Button
          onClick={handleSurprise}
          variant="ghost"
          className="group text-foreground/90 hover:bg-accent hover:text-accent-foreground flex h-12 w-12 items-center justify-center rounded-lg text-sm font-medium transition-colors md:w-auto md:justify-start md:px-3"
        >
          <Sparkles className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Surprise!</span>
        </Button>
      </nav>

      {/* Actions */}
      <div className="min-h-0 border-t p-4 pt-3">
        <div className="flex flex-col gap-2">
          {isSignedIn && (
            <>
              <Button
                onClick={() => setIsCreatePollOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-9 items-center justify-center rounded-lg shadow-sm md:w-auto md:justify-start md:px-3"
              >
                <Plus className="h-6 w-6" />
                <span className="hidden md:inline">Create Poll</span>
              </Button>
              <Separator className="hidden md:block" />
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground hidden text-sm font-medium md:block">
              Theme
            </span>
            <ModeToggle />
          </div>
          <Separator className="hidden md:block" />
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground justify-center md:h-auto md:w-full md:justify-between md:p-2"
                >
                  <div className="flex w-full items-center justify-center md:justify-between">
                    <Avatar size="sm" />
                    <div className="hidden min-w-0 flex-1 md:block">
                      <p className="ml-3 text-center text-sm font-medium">
                        {`@${user?.username || "User"}`}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    to="/users/$username"
                    params={{ username: user?.username || "" }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Change Username</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsProfileDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInButton mode="modal">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 shadow-sm">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Username Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Enter a new username. It must be 3-20 characters long and contain
              only letters, numbers, underscores, and hyphens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={usernameId}>New Username</Label>
              <Input
                id={usernameId}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new username"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUsername}>Update Username</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Poll Dialog */}
      <Dialog open={isCreatePollOpen} onOpenChange={setIsCreatePollOpen}>
        <Suspense fallback={<Loader />}>
          <CreatePollDialogContent
            onClose={() => setIsCreatePollOpen(false)}
            icon={createPollIcon}
          />
        </Suspense>
      </Dialog>

      {/* Custom Profile Dialog */}
      <Suspense fallback={<Loader />}>
        <CustomProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
        />
      </Suspense>
    </div>
  )
}
