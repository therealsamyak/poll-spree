import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { validateMultipleInputs } from "@/lib/badWordsFilter"
import { api } from "../../convex/_generated/api"

interface PollOption {
  id: string
  text: string
}

export const useCreatePoll = () => {
  const { userId } = useAuth()
  const user = useQuery(api.users.getUser, { userId: userId || "" })
  const createPoll = useMutation(api.polls.createPoll)

  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [isDev, setIsDev] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const resetForm = () => {
    setQuestion("")
    setOptions([
      { id: "1", text: "" },
      { id: "2", text: "" },
    ])
    setIsDev(false)
  }

  const addOption = () => {
    if (options.length < 6) {
      const newId = (options.length + 1).toString()
      setOptions([...options, { id: newId, text: "" }])
    }
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== id))
    }
  }

  const updateOption = (id: string, value: string) => {
    const newOptions = options.map((option) =>
      option.id === id ? { ...option, text: value } : option,
    )
    setOptions(newOptions)
  }

  const handleCreatePoll = async (e: React.FormEvent, onSuccess?: () => void) => {
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
      resetForm()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create poll")
    } finally {
      setIsCreating(false)
    }
  }

  return {
    // State
    question,
    setQuestion,
    options,
    isDev,
    setIsDev,
    isCreating,

    // Actions
    handleCreatePoll,
    addOption,
    removeOption,
    updateOption,
    resetForm,

    // Computed
    canAddOption: options.length < 6,
    canRemoveOption: options.length > 2,
  }
}
