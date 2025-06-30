import { SignInButton, useAuth, useClerk } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { BarChart3, Home, LogOut, Plus, Settings, TrendingUp, User, X } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { Avatar } from "@/components/avatar"
import { CustomProfileDialog } from "@/components/custom-profile-dialog"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { validateMultipleInputs } from "@/lib/badWordsFilter"
import { isReservedUsername, validateUsername } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

export const Sidebar = () => {
  return (
    <aside className="fixed inset-y-0 z-50 flex w-16 flex-col border-r bg-background md:w-64">
      <SidebarContent />
    </aside>
  )
}

const SidebarContent = () => {
  const { isSignedIn, userId } = useAuth()
  const { signOut } = useClerk()
  const user = useQuery(api.users.getUser, { userId: userId || "" })
  const updateUsername = useMutation(api.users.updateUsername)
  const createPoll = useMutation(api.polls.createPoll)
  const [newUsername, setNewUsername] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [isDev, setIsDev] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const usernameId = useId()
  const questionId = useId()
  const devId = useId()

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !userId) return

    // Validate username using comprehensive validation
    const validation = validateUsername(newUsername)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    // Check for reserved usernames
    if (isReservedUsername(newUsername)) {
      toast.error("This username is reserved and cannot be used.")
      return
    }

    try {
      const result = await updateUsername({ userId, username: newUsername.trim() })

      if (result.success) {
        setNewUsername("")
        setIsDialogOpen(false)
        toast.success("Username updated successfully!")
      } else {
        toast.error(result.error || "Failed to update username")
      }
    } catch (_error) {
      toast.error("An unexpected error occurred. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUpdateUsername()
    }
  }

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error("Please sign in to create a poll")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    const validOptions = options.filter((option) => option.text.trim())
    if (validOptions.length < 2) {
      toast.error("Please enter at least 2 options")
      return
    }

    if (!user?.username) {
      toast.error("Please set a username before creating a poll")
      return
    }

    // Validate all inputs for inappropriate content
    const inputsToValidate = {
      "poll question": question.trim(),
      ...options.reduce(
        (acc, option, index) => {
          // Only include options that have text
          if (option.text.trim()) {
            acc[`poll option ${index + 1}`] = option.text.trim()
          }
          return acc
        },
        {} as Record<string, string>,
      ),
    }

    const validation = validateMultipleInputs(inputsToValidate)
    if (!validation.isValid) {
      toast.error(
        `${validation.fieldName.charAt(0).toUpperCase() + validation.fieldName.slice(1)} contains inappropriate content and cannot be used.`,
      )
      return
    }

    setIsCreating(true)
    try {
      await createPoll({
        question: question.trim(),
        options: validOptions.map((option) => option.text.trim()),
        authorId: userId,
        authorUsername: user.username,
        dev: isDev,
      })
      toast.success("Poll created successfully!")
      setIsCreatePollOpen(false)
      setQuestion("")
      setOptions([
        { id: "1", text: "" },
        { id: "2", text: "" },
      ])
      setIsDev(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create poll")
    } finally {
      setIsCreating(false)
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
      <div className="border-t p-4 pt-3">
        <div className="flex flex-col gap-2">
          {isSignedIn && (
            <Button
              onClick={() => setIsCreatePollOpen(true)}
              className="flex h-10 w-12 items-center justify-center rounded-lg hover:bg-primary/40 hover:text-black md:w-auto md:justify-start md:px-3 dark:hover:bg-primary/50 dark:hover:text-white"
            >
              <Plus className="h-6 w-6" />
              <span className="hidden md:inline">Create Poll</span>
            </Button>
          )}
          <Separator className="hidden md:block" />
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
                  className="justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:h-auto md:w-full md:justify-between md:p-2 dark:hover:bg-accent dark:hover:text-accent-foreground"
                >
                  <div className="flex w-full items-center justify-center md:justify-between">
                    <Avatar size="sm" />
                    <div className="hidden min-w-0 flex-1 md:block">
                      <p className="ml-3 text-center font-medium text-sm">
                        {user?.username || "User"}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="group">
                  <User className="mr-2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-white dark:group-hover:text-black" />
                  <span>Change Username</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)} className="group">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-white dark:group-hover:text-accent-foreground" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="group">
                  <LogOut className="mr-2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-white dark:group-hover:text-black" />
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
              Enter a new username. It must be 3-20 characters long and contain only letters,
              numbers, underscores, and hyphens.
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              Create New Poll
            </DialogTitle>
            <DialogDescription>
              Start a conversation with your community. Ask a question and let people vote!
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePoll} className="space-y-6">
            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor={questionId} className="font-medium text-sm">
                Question *
              </Label>
              <Textarea
                id={questionId}
                placeholder="What would you like to ask the community?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[80px] resize-none"
                required
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">Options *</Label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => {
                        const newOptions = options.map((opt) =>
                          opt.id === option.id ? { ...opt, text: e.target.value } : opt,
                        )
                        setOptions(newOptions)
                      }}
                      className="flex-1"
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (options.length > 2) {
                            setOptions(options.filter((opt) => opt.id !== option.id))
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (options.length < 6) {
                      const newId = (options.length + 1).toString()
                      setOptions([...options, { id: newId, text: "" }])
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            {/* Dev Poll Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={devId}
                checked={isDev}
                onCheckedChange={(checked) => setIsDev(checked as boolean)}
              />
              <Label
                htmlFor={devId}
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark as developer poll
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatePollOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Poll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Profile Dialog */}
      <CustomProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </div>
  )
}
