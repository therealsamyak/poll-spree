import { SignInButton, UserButton, useAuth, useClerk } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Home, LogOut, Settings, TrendingUp, User } from "lucide-react"
import { useId, useState } from "react"
import { api } from "../../convex/_generated/api"
import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"

export const Sidebar = () => {
  return (
    <aside className="fixed inset-y-0 z-50 flex w-16 flex-col border-r bg-background md:w-64">
      <SidebarContent />
    </aside>
  )
}

const SidebarContent = () => {
  const { isSignedIn, userId } = useAuth()
  const { openUserProfile, signOut } = useClerk()
  const user = useQuery(api.polls.getUser, { userId: userId || "" })
  const updateUsername = useMutation(api.polls.updateUsername)
  const [newUsername, setNewUsername] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const usernameId = useId()

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !userId) return

    try {
      await updateUsername({ userId, username: newUsername.trim() })
      setNewUsername("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to update username:", error)
      // You might want to show a toast notification here
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUpdateUsername()
    }
  }

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo and Brand */}
      <div className="flex h-16 items-center border-b px-3 md:px-6">
        <Link to="/" className="flex items-center space-x-3 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="hidden font-bold md:inline">Poll Spree</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2 py-6 md:items-stretch md:gap-2 md:px-4">
        <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground md:w-auto md:justify-start md:px-3"
        >
          <Home className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Home</span>
        </Link>
        <Link
          to="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground md:w-auto md:justify-start md:px-3"
        >
          <TrendingUp className="h-6 w-6" />
          <span className="ml-2 hidden md:inline">Trending</span>
        </Link>
      </nav>

      {/* Actions */}
      <div className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="hidden font-medium text-muted-foreground text-sm md:block">Theme</span>
            <ModeToggle />
          </div>
          <Separator className="hidden md:block" />
          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="justify-center md:w-full md:h-auto md:p-2 md:justify-between bg-transparent hover:bg-accent hover:text-black focus:bg-accent focus:text-black active:bg-accent active:text-black dark:hover:bg-accent dark:focus:bg-accent dark:active:bg-accent"
                >
                  <div className="flex w-full items-center justify-center md:justify-between">
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-8 w-8",
                        },
                      }}
                    />
                    <div className="hidden min-w-0 flex-1 md:block">
                      <p className="ml-3 text-left font-medium text-sm">
                        {user?.username || "User"}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Change Username</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SignInButton mode="modal">
              <Button className="w-full gap-2 bg-primary shadow-lg hover:bg-accent">Sign In</Button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Change Username Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Enter a new username for your account. This will be displayed on all your polls.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={usernameId} className="text-right">
                Username
              </Label>
              <Input
                id={usernameId}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new username"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUsername} disabled={!newUsername.trim()}>
              Update Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
