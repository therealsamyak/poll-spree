import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { Plus, Sparkles, X } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { validateMultipleInputs } from "@/lib/badWordsFilter"
import { api } from "../../../convex/_generated/api"

export const CreatePollDialog = () => {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [isDev, setIsDev] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const questionId = useId()
  const devId = useId()

  const { userId } = useAuth()
  const user = useQuery(api.users.getUser, { userId: userId || "" })
  const createPoll = useMutation(api.polls.createPoll)

  const handleAddOption = () => {
    if (options.length < 6) {
      const newId = (options.length + 1).toString()
      setOptions([...options, { id: newId, text: "" }])
    }
  }

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== id))
    }
  }

  const handleOptionChange = (id: string, value: string) => {
    const newOptions = options.map((option) =>
      option.id === id ? { ...option, text: value } : option,
    )
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      ...validOptions.reduce(
        (acc, option, index) => {
          acc[`poll option ${index + 1}`] = option.text.trim()
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
      setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 hover:bg-primary/40 hover:text-black dark:hover:bg-primary/50 dark:hover:text-white">
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Poll
          </DialogTitle>
          <DialogDescription>
            Start a conversation with your community. Ask a question and let people vote!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              {options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${option.id}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    className="flex-1"
                    required
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
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
                onClick={handleAddOption}
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
              onClick={() => setOpen(false)}
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
  )
}
