import { Plus, Sparkles, X } from "lucide-react"
import { useId, useState } from "react"
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
import { useCreatePoll } from "@/hooks/useCreatePoll"

export const CreatePollDialog = () => {
  const [open, setOpen] = useState(false)
  const {
    question,
    setQuestion,
    options,
    isDev,
    setIsDev,
    isCreating,
    handleCreatePoll,
    addOption,
    removeOption,
    updateOption,
    canAddOption,
    canRemoveOption,
  } = useCreatePoll()

  const questionId = useId()
  const devId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    await handleCreatePoll(e, () => setOpen(false))
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
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className="flex-1"
                    required
                  />
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
