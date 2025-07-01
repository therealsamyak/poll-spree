import { Plus, Sparkles, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
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
import { useCreatePoll } from "@/hooks/useCreatePoll"

// Shared dialog component that can be used by both sidebar and homepage
export const CreatePollDialogContent = ({
  onClose,
  icon = <Sparkles className="h-5 w-5 text-primary" />,
}: {
  onClose: () => void
  icon?: React.ReactNode
}) => {
  const {
    question,
    setQuestion,
    options,
    // isDev,
    // setIsDev,
    isCreating,
    handleCreatePoll,
    addOption,
    removeOption,
    updateOption,
    canAddOption,
    canRemoveOption,
  } = useCreatePoll()

  const questionId = useId()
  const _devId = useId()

  // --- Focus logic for new option ---
  const optionRefs = useRef<(HTMLInputElement | null)[]>([])
  const prevOptionsLength = useRef(options.length)

  useEffect(() => {
    if (options.length > prevOptionsLength.current) {
      // Focus the last input
      optionRefs.current[options.length - 1]?.focus()
    }
    prevOptionsLength.current = options.length
  }, [options.length])
  // --- End focus logic ---

  const handleSubmit = async (e: React.FormEvent) => {
    await handleCreatePoll(e, onClose)
  }

  // Character count styling functions
  const getCharacterCountColor = (length: number, max: number) => {
    if (length > max) return "text-destructive"
    if (length > max * 0.9) return "text-accent-foreground"
    return "text-muted-foreground"
  }

  const getCharacterCountBg = (length: number, max: number) => {
    if (length > max) return "bg-destructive/10 dark:bg-destructive/20"
    if (length > max * 0.9) return "bg-accent/10 dark:bg-accent/20"
    return ""
  }

  // Validation states
  const isQuestionValid = question.trim().length > 0
  const hasMinimumOptions = options.length >= 2
  const isFormValid = isQuestionValid && hasMinimumOptions

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          {icon}
          Create New Poll
        </DialogTitle>
        <DialogDescription>Ask a question and let people vote!</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor={questionId} className="font-medium text-sm">
            Question *
          </Label>
          <div className="relative">
            <Textarea
              id={questionId}
              placeholder="What would you like to ask the community?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={`min-h-[80px] resize-none pr-16 ${getCharacterCountBg(question.length, 280)} ${
                question.length > 280 ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
              required
            />
            <div
              className={`absolute right-3 bottom-3 rounded bg-background/80 px-2 py-1 text-xs backdrop-blur-sm ${getCharacterCountColor(question.length, 280)}`}
            >
              {question.length}/280
            </div>
          </div>
          {question.length > 280 && (
            <p className="text-destructive text-xs">Question cannot exceed 280 characters</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          <Label className="font-medium text-sm">Options *</Label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={(el) => {
                      optionRefs.current[index] = el
                    }}
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className={`pr-16 ${getCharacterCountBg(option.text.length, 280)} ${
                      option.text.length > 280
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    required
                  />
                  <div
                    className={`-translate-y-1/2 absolute top-1/2 right-3 rounded bg-background/80 px-2 py-1 text-xs backdrop-blur-sm ${getCharacterCountColor(option.text.length, 280)}`}
                  >
                    {option.text.length}/280
                  </div>
                </div>
                {canRemoveOption && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(option.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {canAddOption && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          )}
          <div className="text-muted-foreground text-xs">
            {options.length}/10 options • Minimum 2 required
          </div>
        </div>

        {/* Dev Poll Toggle */}
        {/* <div className="flex items-center space-x-2">
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
        </div> */}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || !isFormValid}>
            {isCreating ? "Creating..." : "Create Poll"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// Original component for homepage button
export const CreatePollDialog = () => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 hover:bg-primary/40 hover:text-black dark:hover:bg-primary/50 dark:hover:text-white">
          <Plus className="h-4 w-4" />
          Create Poll
        </Button>
      </DialogTrigger>
      <CreatePollDialogContent onClose={() => setOpen(false)} />
    </Dialog>
  )
}
