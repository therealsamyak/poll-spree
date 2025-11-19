import { useAuth } from "@clerk/clerk-react"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { useNotification } from "@/components/ui/notification"
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
  const { showNotification } = useNotification()

  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [isDev, setIsDev] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: Date.now().toString(), text: "" }])
    }
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== id))
    }
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((option) => (option.id === id ? { ...option, text } : option)))
  }

  const canAddOption = options.length < 10
  const canRemoveOption = options.length > 2

  const handleCreatePoll = async (e: React.FormEvent, onSuccess?: () => void) => {
    e.preventDefault()
    if (!userId || !user) return

    setIsCreating(true)

    try {
      // Filter out empty options
      const validOptions = options
        .map((option) => option.text.trim())
        .filter((text) => text.length > 0)

      // Check for inappropriate content
      const inputsToValidate: Record<string, string> = {
        "poll question": question.trim(),
        ...validOptions.reduce(
          (acc, option, index) => {
            acc[`poll option ${index + 1}`] = option
            return acc
          },
          {} as Record<string, string>,
        ),
      }

      const validation = validateMultipleInputs(inputsToValidate)
      if (!validation.isValid) {
        showNotification({
          message: `${validation.fieldName.charAt(0).toUpperCase() + validation.fieldName.slice(1)} contains inappropriate content and cannot be used.`,
          variant: "error",
        })
        return
      }

      const result = await createPoll({
        question: question.trim(),
        options: validOptions,
        authorId: userId,
        authorUsername: user.username || "Anonymous",
        dev: isDev,
      })

      if (result?.success) {
        showNotification({ message: "Poll created successfully!", variant: "success" })
        setQuestion("")
        setOptions([
          { id: "1", text: "" },
          { id: "2", text: "" },
        ])
        setIsDev(false)
        onSuccess?.()
      } else {
        showNotification({ message: result?.error || "Failed to create poll", variant: "error" })
      }
    } catch (error) {
      console.error("Error creating poll:", error)
      showNotification({ message: "An unexpected error occurred", variant: "error" })
    } finally {
      setIsCreating(false)
    }
  }

  return {
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
  }
}
