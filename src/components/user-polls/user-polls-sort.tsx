import { useNavigate } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortOption = "recent" | "oldest" | "most-voted" | "least-voted"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Least Recent" },
  { value: "most-voted", label: "Most Voted" },
  { value: "least-voted", label: "Least Voted" },
]

interface UserPollsSortProps {
  currentSort: SortOption
}

export const UserPollsSort = ({ currentSort }: UserPollsSortProps) => {
  const navigate = useNavigate()

  const handleSortChange = (sort: SortOption) => {
    navigate({
      search: (prev) => ({
        ...prev,
        sort,
      }),
      replace: true,
    })
  }

  const currentSortLabel =
    sortOptions.find((option) => option.value === currentSort)?.label || "Sort by"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {currentSortLabel}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={currentSort === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
