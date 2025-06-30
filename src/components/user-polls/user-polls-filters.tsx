import { useNavigate, useSearch } from "@tanstack/react-router"
import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type FilterType = "authored" | "voted"

interface UserPollsFiltersProps {
  currentFilters: FilterType[]
}

export const UserPollsFilters = ({ currentFilters }: UserPollsFiltersProps) => {
  const navigate = useNavigate()
  const _search = useSearch({ from: "/users/$username" })
  const authoredId = useId()
  const votedId = useId()

  const handleFilterChange = (filter: FilterType, checked: boolean) => {
    let newFilters: FilterType[]

    if (checked) {
      // Add filter if not already present
      newFilters = [...currentFilters, filter]
    } else {
      // Remove filter, but ensure at least one remains
      newFilters = currentFilters.filter((f) => f !== filter)
      if (newFilters.length === 0) {
        // If removing would leave no filters, keep the current one
        newFilters = currentFilters
      }
    }

    // Update URL params without causing a full page reload
    navigate({
      search: (prev) => ({
        ...prev,
        filter: newFilters.join(","),
      }),
      replace: true,
    })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:space-x-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={authoredId}
          checked={currentFilters.includes("authored")}
          onCheckedChange={(checked) => handleFilterChange("authored", checked as boolean)}
        />
        <Label htmlFor={authoredId} className="font-medium text-sm">
          Authored
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={votedId}
          checked={currentFilters.includes("voted")}
          onCheckedChange={(checked) => handleFilterChange("voted", checked as boolean)}
        />
        <Label htmlFor={votedId} className="font-medium text-sm">
          Voted On
        </Label>
      </div>
    </div>
  )
}
